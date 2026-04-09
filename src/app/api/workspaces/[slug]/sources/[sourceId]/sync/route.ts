import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getWorkspaceAccess } from "@/lib/workspaces";

export async function POST(
  _req: Request,
  context: { params: Promise<{ slug: string; sourceId: string }> }
) {
  try {
    const { slug, sourceId } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        workspaceId: access.workspace.id,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const sync = await prisma.sourceSync.create({
      data: {
        workspaceId: access.workspace.id,
        sourceId: source.id,
        status: "RUNNING",
        startedAt: new Date(),
        summary: `Mock sync started for ${source.name}.`,
      },
    });

    const recordsFound = source.type === "MANUAL_UPLOAD" ? 0 : 3;

    const completedSync = await prisma.sourceSync.update({
      where: {
        id: sync.id,
      },
      data: {
        status: "COMPLETED",
        recordsFound,
        summary:
          source.type === "MANUAL_UPLOAD"
            ? "Manual upload sources do not sync externally. Use document upload to add records."
            : `Mock sync completed. ${recordsFound} upstream records were discovered for preview.`,
        completedAt: new Date(),
      },
    });

    await prisma.source.update({
      where: {
        id: source.id,
      },
      data: {
        status: source.type === "MANUAL_UPLOAD" ? "ACTIVE" : "ACTIVE",
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ sync: completedSync });
  } catch (error) {
    console.error("POST /api/workspaces/[slug]/sources/[sourceId]/sync failed:", error);
    return NextResponse.json({ error: "Failed to run source sync" }, { status: 500 });
  }
}
