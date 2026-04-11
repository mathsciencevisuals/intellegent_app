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
      memberships: {
        select: {
          workspaceId: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceIds = user.memberships.map((membership) => membership.workspaceId);

  const jobs = workspaceIds.length
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
        take: 24,
      })
    : [];

  return NextResponse.json({
    jobs: jobs.map((job) => ({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      featureCount: job.featureCount,
      workspace: job.workspace,
      document: job.document,
    })),
  });
}
