import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { updateSavedViewSchema } from "@/lib/saved-views";
import { getWorkspaceAccess } from "@/lib/workspaces";

type RouteContext = {
  params: Promise<{ slug: string; viewId: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { slug, viewId } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSavedViewSchema.parse(body);

    const savedView = await prisma.savedView.findFirst({
      where: {
        id: viewId,
        workspaceId: access.workspace.id,
        userId: access.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!savedView) {
      return NextResponse.json({ error: "Saved view not found" }, { status: 404 });
    }

    const updatedSavedView = await prisma.savedView.update({
      where: {
        id: savedView.id,
      },
      data: {
        ...(parsed.name ? { name: parsed.name } : {}),
      },
    });

    return NextResponse.json({ savedView: updatedSavedView });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("PATCH /api/workspaces/[slug]/saved-views/[viewId] failed:", error);
    return NextResponse.json({ error: "Failed to update saved view" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { slug, viewId } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const savedView = await prisma.savedView.findFirst({
      where: {
        id: viewId,
        workspaceId: access.workspace.id,
        userId: access.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!savedView) {
      return NextResponse.json({ error: "Saved view not found" }, { status: 404 });
    }

    await prisma.savedView.delete({
      where: {
        id: savedView.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workspaces/[slug]/saved-views/[viewId] failed:", error);
    return NextResponse.json({ error: "Failed to delete saved view" }, { status: 500 });
  }
}
