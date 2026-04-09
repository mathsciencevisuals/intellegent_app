import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type KpiRow = { label: string; value: string; helper: string };
type ModuleBreakdownRow = {
  module: string;
  capabilityCount: number;
  featureCount: number;
  weeklyHoursWasted: number;
  opportunityScore: number;
  narrative: string;
};
type DonutRow = { label: string; value: number; helper: string };
type OpportunityRow = {
  capability: string;
  module: string;
  score: number;
  annualDollarImpact: number;
  rationale: string;
};
type RoadmapStatRow = { label: string; value: number; helper: string };
type RiskRow = { title: string; severity: string; mitigation: string };
type QuickWinRow = { title: string; summary: string; breakEvenMonths: number };
type UiCopy = {
  ingestTab: {
    featureInventory: string;
    maturity: string;
    gapAnalysis: string;
    roadmap: string;
  };
  featuresTab: {
    scoreGuide: string;
    impactGuide: string;
  };
  dashboardTab: {
    moduleBreakdown: string;
    opportunities: string;
    riskRegister: string;
  };
};

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asObject<T>(value: unknown, fallback: T) {
  return value && typeof value === "object" ? (value as T) : fallback;
}

const ANALYTICS_SCHEMA_IDENTIFIERS = [
  "Capability",
  "CapabilityAssessment",
  "RoadmapRecommendation",
  "DashboardSnapshot",
];

export function isMissingAnalyticsSchemaError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021") {
    return false;
  }

  return ANALYTICS_SCHEMA_IDENTIFIERS.some((identifier) =>
    error.message.includes(identifier)
  );
}

export async function getLatestWorkspaceAnalytics(workspaceId: string) {
  let latestJob;

  try {
    latestJob = await prisma.extractionJob.findFirst({
      where: {
        workspaceId,
        status: "COMPLETED",
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
          },
        },
        dashboardSnapshot: true,
        capabilities: {
          include: {
            assessment: true,
            features: {
              select: {
                id: true,
                title: true,
                status: true,
                confidenceScore: true,
                owner: true,
                tags: true,
                module: true,
              },
              orderBy: [
                {
                  confidenceScore: "desc",
                },
                {
                  updatedAt: "desc",
                },
              ],
            },
            roadmapRecommendations: {
              orderBy: {
                priority: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        roadmapRecommendations: {
          orderBy: {
            priority: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    if (isMissingAnalyticsSchemaError(error)) {
      console.warn(
        "Workspace analytics tables are missing. Apply the latest Prisma migrations to enable pipeline analytics."
      );
      return null;
    }

    throw error;
  }

  if (!latestJob) {
    return null;
  }

  const snapshot = latestJob.dashboardSnapshot;

  return {
    latestJob,
    dashboardSnapshot: snapshot
      ? {
          ...snapshot,
          kpiJson: asArray<KpiRow>(snapshot.kpiJson),
          moduleBreakdownJson: asArray<ModuleBreakdownRow>(snapshot.moduleBreakdownJson),
          donutChartJson: asArray<DonutRow>(snapshot.donutChartJson),
          topOpportunitiesJson: asArray<OpportunityRow>(snapshot.topOpportunitiesJson),
          roadmapStatsJson: asArray<RoadmapStatRow>(snapshot.roadmapStatsJson),
          riskRegisterJson: asArray<RiskRow>(snapshot.riskRegisterJson),
          quickWinsJson: asArray<QuickWinRow>(snapshot.quickWinsJson),
          uiCopyJson: asObject<UiCopy>(snapshot.uiCopyJson, {
            ingestTab: {
              featureInventory: "",
              maturity: "",
              gapAnalysis: "",
              roadmap: "",
            },
            featuresTab: {
              scoreGuide: "",
              impactGuide: "",
            },
            dashboardTab: {
              moduleBreakdown: "",
              opportunities: "",
              riskRegister: "",
            },
          }),
        }
      : null,
  };
}
