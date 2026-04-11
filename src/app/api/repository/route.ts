import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { FeatureStatus, Prisma } from "@/generated/prisma/client";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeParam(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

type RepositoryFeatureListItem = Prisma.FeatureGetPayload<{
  include: {
    workspace: {
      select: {
        name: true;
        slug: true;
      };
    };
  };
}>;

function isFeatureStatus(value: string | undefined): value is FeatureStatus {
  return Object.values(FeatureStatus).includes(value as FeatureStatus);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
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
  const q = normalizeParam(request.nextUrl.searchParams.get("q"));
  const status = normalizeParam(request.nextUrl.searchParams.get("status"));
  const moduleName = normalizeParam(request.nextUrl.searchParams.get("module"));
  const workspaceSlug = normalizeParam(request.nextUrl.searchParams.get("workspace"));
  const normalizedStatus = isFeatureStatus(status) ? status : undefined;

  const where: Prisma.FeatureWhereInput = {
    workspaceId: {
      in: workspaceIds,
    },
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
    ...(moduleName ? { module: moduleName } : {}),
    ...(workspaceSlug ? { workspace: { slug: workspaceSlug } } : {}),
    ...(q
      ? {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [features, workspaceOptions, modules] = await Promise.all([
    workspaceIds.length
      ? prisma.feature.findMany({
          where,
          include: {
            workspace: {
              select: {
                name: true,
                slug: true,
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
          take: 40,
        })
      : Promise.resolve<RepositoryFeatureListItem[]>([]),
    workspaceIds.length
      ? prisma.workspace.findMany({
          where: {
            id: {
              in: workspaceIds,
            },
          },
          select: {
            name: true,
            slug: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),
    workspaceIds.length
      ? prisma.feature.findMany({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
          },
          select: {
            module: true,
          },
          distinct: ["module"],
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    features: features.map((feature) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      confidenceScore: feature.confidenceScore,
      module: feature.module,
      workspace: feature.workspace,
    })),
    workspaces: workspaceOptions,
    modules: modules
      .map((item) => item.module)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => left.localeCompare(right)),
  });
}
