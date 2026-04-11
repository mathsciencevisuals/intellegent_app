import { NextRequest, NextResponse } from "next/server";

import { getWorkspaceAccess } from "@/lib/workspaces";
import { canManageMembers } from "@/lib/permissions/workspace";
import { workspaceAIConfigWriteSchema } from "@/lib/ai-config/shared";
import {
  resolveWorkspaceAiConfig,
  WorkspaceAIConfigStorageUnavailableError,
  updateWorkspaceAIConfig,
} from "@/lib/ai-config/workspace-ai-config";
import { z } from "zod";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const config = await resolveWorkspaceAiConfig(access.workspace.id);

    // Never return the encrypted key value to the client
    return NextResponse.json({
      ...config,
      workspaceApiKeyEncrypted: config.workspaceApiKeyEncrypted ? "**set**" : null,
    });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/ai-config failed:", error);
    return NextResponse.json({ error: "Failed to load AI config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
        { error: "Only workspace administrators can update AI configuration" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = workspaceAIConfigWriteSchema.parse(body);

    const updated = await updateWorkspaceAIConfig(access.workspace.id, parsed);

    return NextResponse.json({
      ...updated,
      workspaceApiKeyEncrypted: updated.workspaceApiKeyEncrypted ? "**set**" : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    if (error instanceof WorkspaceAIConfigStorageUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("PUT /api/workspaces/[slug]/ai-config failed:", error);
    return NextResponse.json({ error: "Failed to update AI config" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return PUT(req, context);
}
