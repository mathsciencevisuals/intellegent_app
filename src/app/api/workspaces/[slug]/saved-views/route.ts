import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSavedViewSchema,
  parseSavedViewFilters,
  savedViewScopeSchema,
} from "@/lib/saved-views";
import { getWorkspaceAccess } from "@/lib/workspaces";

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

    const scope = savedViewScopeSchema.parse(req.nextUrl.searchParams.get("scope"));

    const savedViews = await prisma.savedView.findMany({
      where: {
        workspaceId: access.workspace.id,
        userId: access.user.id,
        scope,
      },
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ savedViews });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("GET /api/workspaces/[slug]/saved-views failed:", error);
    return NextResponse.json({ error: "Failed to fetch saved views" }, { status: 500 });
  }
}

export async function POST(
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

    const body = await req.json();
    const parsed = createSavedViewSchema.parse(body);
    const filters = parseSavedViewFilters(parsed.scope, parsed.filters);

    const savedView = await prisma.savedView.create({
      data: {
        workspaceId: access.workspace.id,
        userId: access.user.id,
        scope: parsed.scope,
        name: parsed.name,
        filters,
      },
    });

    return NextResponse.json({ savedView }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("POST /api/workspaces/[slug]/saved-views failed:", error);
    return NextResponse.json({ error: "Failed to create saved view" }, { status: 500 });
  }
}
