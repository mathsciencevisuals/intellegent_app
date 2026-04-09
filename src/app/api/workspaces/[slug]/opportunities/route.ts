import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listWorkspaceOpportunities } from "@/lib/pipeline/opportunity-queries";
import { getWorkspaceAccess } from "@/lib/workspaces";

const opportunityQuerySchema = z.object({
  q: z.string().trim().optional(),
  module: z.string().trim().optional(),
  maturity: z.enum(["NON_AGENTIC", "PARTIAL", "AGENTIC"]).optional(),
  sort: z.enum(["roi", "risk", "priority"]).optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const parsed = opportunityQuerySchema.parse({
      q: req.nextUrl.searchParams.get("q") ?? undefined,
      module: req.nextUrl.searchParams.get("module") ?? undefined,
      maturity: req.nextUrl.searchParams.get("maturity") ?? undefined,
      sort: req.nextUrl.searchParams.get("sort") ?? undefined,
    });

    const opportunities = await listWorkspaceOpportunities({
      workspaceId: access.workspace.id,
      search: parsed.q,
      module: parsed.module,
      maturity: parsed.maturity,
      sort: parsed.sort,
    });

    return NextResponse.json({ opportunities });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("GET /api/workspaces/[slug]/opportunities failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
