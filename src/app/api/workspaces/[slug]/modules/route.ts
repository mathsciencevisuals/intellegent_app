import { NextRequest, NextResponse } from "next/server";

import { listWorkspaceModuleSummaries } from "@/lib/pipeline/opportunity-queries";
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

    const modules = await listWorkspaceModuleSummaries(access.workspace.id);

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/modules failed:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}
