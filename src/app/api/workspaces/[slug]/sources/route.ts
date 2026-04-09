import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getWorkspaceAccess } from "@/lib/workspaces";

const createSourceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum([
    "MANUAL_UPLOAD",
    "JIRA",
    "AZURE_DEVOPS",
    "CONFLUENCE",
    "NOTION",
    "SHAREPOINT",
  ]),
  syncFrequency: z.enum(["MANUAL", "DAILY", "WEEKLY"]).default("MANUAL"),
  connectionNotes: z.string().trim().max(200).optional().or(z.literal("")),
});

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

    const sources = await prisma.source.findMany({
      where: {
        workspaceId: access.workspace.id,
      },
      include: {
        _count: {
          select: {
            documents: true,
            syncs: true,
          },
        },
        syncs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: [
        {
          type: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/sources failed:", error);
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
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

    if (!access.workspace || !access.membership) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createSourceSchema.parse(body);
    const source = await prisma.source.create({
      data: {
        workspaceId: access.workspace.id,
        name: parsed.name,
        type: parsed.type,
        syncFrequency: parsed.syncFrequency,
        connectionNotes: parsed.connectionNotes?.trim() || null,
        status:
          parsed.type === "MANUAL_UPLOAD" ? "ACTIVE" : "NEEDS_ATTENTION",
      },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("POST /api/workspaces/[slug]/sources failed:", error);
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
