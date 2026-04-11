import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      memberships: {
        orderBy: {
          workspace: {
            updatedAt: "desc",
          },
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              updatedAt: true,
              _count: {
                select: {
                  documents: true,
                  extractionJobs: true,
                },
              },
            },
          },
        },
        take: 6,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceIds = user.memberships.map((membership) => membership.workspaceId);
  const recentRuns = workspaceIds.length
    ? await prisma.extractionJob.findMany({
        where: {
          workspaceId: {
            in: workspaceIds,
          },
        },
        select: {
          id: true,
          status: true,
          featureCount: true,
          createdAt: true,
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
          document: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      })
    : [];

  return NextResponse.json({
    recentWorkspaces: user.memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      docs: membership.workspace._count.documents,
      analyses: membership.workspace._count.extractionJobs,
      status:
        membership.workspace._count.extractionJobs > 0
          ? "ACTIVE"
          : membership.workspace._count.documents > 0
            ? "READY"
            : "DRAFT",
      updatedAt: membership.workspace.updatedAt.toISOString(),
    })),
    recentAnalyses: recentRuns.map((run) => ({
      id: run.id,
      name: run.document.title,
      workspaceName: run.workspace.name,
      workspaceSlug: run.workspace.slug,
      status: run.status,
      features: run.featureCount,
      createdAt: run.createdAt.toISOString(),
    })),
  });
}
