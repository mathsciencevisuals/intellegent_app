import { NextRequest, NextResponse } from "next/server";

import { getWorkspaceOpportunityDetail } from "@/lib/pipeline/opportunity-queries";
import { getWorkspaceAccess } from "@/lib/workspaces";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const opportunity = await getWorkspaceOpportunityDetail({
      workspaceId: access.workspace.id,
      opportunityId: id,
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/opportunities/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}
