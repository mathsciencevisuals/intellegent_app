import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getAnthropicApiKeyConfigurationError,
  getAnthropicApiKeyFormatError,
  resolveAnthropicApiKey,
} from "@/lib/ai-config/provider-runtime";
import { workspaceAIConfigWriteSchema } from "@/lib/ai-config/shared";
import {
  resolveWorkspaceAiConfig,
  WorkspaceAIConfigStorageUnavailableError,
} from "@/lib/ai-config/workspace-ai-config";
import { canManageMembers } from "@/lib/permissions/workspace";
import { getWorkspaceAccess } from "@/lib/workspaces";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!access.membership || !canManageMembers(access.membership.role)) {
      return NextResponse.json(
        { error: "Only workspace administrators can test AI configuration" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = workspaceAIConfigWriteSchema.parse(body);
    const current = await resolveWorkspaceAiConfig(access.workspace.id);
    const candidate = {
      ...current,
      ...parsed,
    };

    if (candidate.provider !== "anthropic") {
      return NextResponse.json(
        { error: `Unsupported AI provider for test connection: ${candidate.provider}` },
        { status: 400 }
      );
    }

    const apiKey = resolveAnthropicApiKey(candidate);

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            getAnthropicApiKeyConfigurationError(candidate) ??
            "No API key is configured for the selected provider",
        },
        { status: 400 }
      );
    }

    const apiKeyFormatError = getAnthropicApiKeyFormatError(apiKey);
    if (apiKeyFormatError) {
      return NextResponse.json({ error: apiKeyFormatError }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    await client.messages.create({
      model: candidate.featureExtractionModel,
      max_tokens: 16,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with ok" }],
    });

    return NextResponse.json({
      ok: true,
      provider: candidate.provider,
      model: candidate.featureExtractionModel,
      message: "Connection succeeded.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    if (error instanceof WorkspaceAIConfigStorageUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to validate AI provider connection";

    console.error("POST /api/workspaces/[slug]/ai-config/test failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
