import { NextRequest, NextResponse } from "next/server";

import { getWorkspaceDashboard } from "@/lib/pipeline/opportunity-queries";
import { getWorkspaceAccess } from "@/lib/workspaces";

export async function GET(
  _req: NextRequest,
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

    const dashboard = await getWorkspaceDashboard(access.workspace.id);

    if (!dashboard) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/dashboard failed:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
