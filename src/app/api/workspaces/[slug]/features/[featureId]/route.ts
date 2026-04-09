import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getWorkspaceAccess } from "@/lib/workspaces";

const reviewFeatureSchema = z.object({
  action: z.literal("review"),
  status: z.enum(["CANDIDATE", "APPROVED", "REJECTED"]).optional(),
  owner: z.string().trim().max(80).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

const mergeFeatureSchema = z.object({
  action: z.literal("merge"),
  targetFeatureId: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; featureId: string }> }
) {
  try {
    const { slug, featureId } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const feature = await prisma.feature.findFirst({
      where: {
        id: featureId,
        workspaceId: access.workspace.id,
      },
      include: {
        mergedInto: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        sources: {
          include: {
            document: true,
            source: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json({ feature });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/features/[featureId] failed:", error);
    return NextResponse.json({ error: "Failed to fetch feature" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string; featureId: string }> }
) {
  try {
    const { slug, featureId } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();

    const feature = await prisma.feature.findFirst({
      where: {
        id: featureId,
        workspaceId: access.workspace.id,
      },
      include: {
        mergedInto: {
          select: {
            id: true,
          },
        },
        sources: {
          select: {
            id: true,
            sourceId: true,
            documentId: true,
            excerpt: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    if (body?.action === "merge") {
      const parsed = mergeFeatureSchema.parse(body);

      if (parsed.targetFeatureId === feature.id) {
        return NextResponse.json(
          { error: "A feature cannot be merged into itself" },
          { status: 400 }
        );
      }

      const target = await prisma.feature.findFirst({
        where: {
          id: parsed.targetFeatureId,
          workspaceId: access.workspace.id,
          status: {
            not: "MERGED",
          },
        },
        include: {
          sources: {
            select: {
              id: true,
              documentId: true,
              sourceId: true,
            },
          },
        },
      });

      if (!target) {
        return NextResponse.json({ error: "Target feature not found" }, { status: 404 });
      }

      const sourceKeys = new Set(
        target.sources.map((item) => `${item.documentId}:${item.sourceId ?? "none"}`)
      );

      await prisma.$transaction(async (tx) => {
        for (const sourceLink of feature.sources) {
          const key = `${sourceLink.documentId}:${sourceLink.sourceId ?? "none"}`;

          if (sourceKeys.has(key)) {
            await tx.featureSource.delete({
              where: {
                id: sourceLink.id,
              },
            });
            continue;
          }

          await tx.featureSource.update({
            where: {
              id: sourceLink.id,
            },
            data: {
              featureId: target.id,
            },
          });
        }

        await tx.feature.update({
          where: {
            id: target.id,
          },
          data: {
            status: target.status === "REJECTED" ? "APPROVED" : target.status,
            tags: Array.from(new Set([...target.tags, ...feature.tags])),
            reviewedAt: new Date(),
          },
        });

        await tx.feature.update({
          where: {
            id: feature.id,
          },
          data: {
            status: "MERGED",
            mergedIntoFeatureId: target.id,
            reviewedAt: new Date(),
          },
        });
      });

      const mergedFeature = await prisma.feature.findUnique({
        where: {
          id: feature.id,
        },
      });

      return NextResponse.json({ feature: mergedFeature });
    }

    const parsed = reviewFeatureSchema.parse(body);

    const updated = await prisma.feature.update({
      where: {
        id: feature.id,
      },
      data: {
        ...(parsed.status === "CANDIDATE" || parsed.status === "APPROVED" || parsed.status === "REJECTED"
          ? { mergedIntoFeatureId: null }
          : {}),
        ...(parsed.status ? { status: parsed.status, reviewedAt: new Date() } : {}),
        ...(parsed.owner !== undefined ? { owner: parsed.owner.trim() || null } : {}),
        ...(parsed.tags ? { tags: parsed.tags.map((item) => item.trim()) } : {}),
      },
    });

    return NextResponse.json({ feature: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("PATCH /api/workspaces/[slug]/features/[featureId] failed:", error);
    return NextResponse.json({ error: "Failed to update feature" }, { status: 500 });
  }
}
