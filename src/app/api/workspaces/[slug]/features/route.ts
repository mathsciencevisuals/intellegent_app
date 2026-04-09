import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getWorkspaceAccess } from "@/lib/workspaces";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

    const q = getSingle(req.nextUrl.searchParams.getAll("q"));
    const status = getSingle(req.nextUrl.searchParams.getAll("status"));
    const moduleName = getSingle(req.nextUrl.searchParams.getAll("module"));
    const tag = getSingle(req.nextUrl.searchParams.getAll("tag"));
    const minConfidenceValue = getSingle(
      req.nextUrl.searchParams.getAll("minConfidence")
    );
    const minConfidence = minConfidenceValue ? Number(minConfidenceValue) : undefined;

    const features = await prisma.feature.findMany({
      where: {
        workspaceId: access.workspace.id,
        ...(status
          ? { status: status as "CANDIDATE" | "APPROVED" | "MERGED" | "REJECTED" }
          : {}),
        ...(moduleName ? { module: moduleName } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(typeof minConfidence === "number" && !Number.isNaN(minConfidence)
          ? { confidenceScore: { gte: minConfidence } }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        mergedInto: {
          select: {
            id: true,
            title: true,
          },
        },
        sources: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
              },
            },
            source: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          confidenceScore: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });

    return NextResponse.json({ features });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/features failed:", error);
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
  }
}
