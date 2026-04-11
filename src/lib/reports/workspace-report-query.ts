import { prisma } from "@/lib/prisma";

type ReportFilterInput = {
  job?: string;
  status?: string;
  module?: string;
  sourceId?: string;
};

function isFeatureStatus(value: string | undefined) {
  return (
    value === "CANDIDATE" ||
    value === "APPROVED" ||
    value === "MERGED" ||
    value === "REJECTED"
  );
}

export function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeReportFilters(input: ReportFilterInput) {
  return {
    job: input.job?.trim() || undefined,
    status: isFeatureStatus(input.status) ? input.status : undefined,
    module: input.module?.trim() || undefined,
    sourceId: input.sourceId?.trim() || undefined,
  };
}

export async function getWorkspaceReportData(input: {
  slug: string;
  userId: string;
  filters: ReportFilterInput;
}) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: input.slug,
      memberships: {
        some: {
          userId: input.userId,
        },
      },
    },
    include: {
      sources: {
        include: {
          documents: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      features: {
        include: {
          capability: {
            select: {
              extractionJobId: true,
            },
          },
          sources: {
            include: {
              source: {
                select: {
                  id: true,
                  name: true,
                },
              },
              document: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const filters = normalizeReportFilters(input.filters);

  const filteredFeatures = workspace.features.filter((feature) => {
    if (filters.job && feature.capability?.extractionJobId !== filters.job) {
      return false;
    }

    if (filters.status && feature.status !== filters.status) {
      return false;
    }

    if (filters.module && (feature.module || "") !== filters.module) {
      return false;
    }

    if (
      filters.sourceId &&
      !feature.sources.some((item) => item.source?.id === filters.sourceId)
    ) {
      return false;
    }

    return true;
  });

  const filteredSources = filters.sourceId
    ? workspace.sources.filter((source) => source.id === filters.sourceId)
    : workspace.sources;

  return {
    workspace,
    filters,
    filteredFeatures,
    filteredSources,
  };
}
