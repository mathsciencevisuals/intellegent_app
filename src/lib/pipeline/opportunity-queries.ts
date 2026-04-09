import { prisma } from "@/lib/prisma";
import type {
  DashboardResponse,
  Maturity,
  ModuleSummary,
  OpportunityResponse,
} from "@/lib/pipeline/types";

type OpportunityDetail = OpportunityResponse & {
  summary: string;
  evidence: Array<{
    featureId: string;
    featureTitle: string;
    excerpts: string[];
    sources: Array<{
      documentId: string;
      documentTitle: string;
      sourceId: string | null;
      sourceName: string | null;
    }>;
  }>;
  explanations: {
    rationale: string;
    scoreExplanations: Record<string, string>;
    implementationGuidance: Record<string, unknown>;
  };
};

type OpportunitySort = "roi" | "risk" | "priority";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getSeverity(
  riskScore: number
): "low" | "medium" | "high" {
  if (riskScore >= 70) {
    return "high";
  }

  if (riskScore >= 45) {
    return "medium";
  }

  return "low";
}

function mapOpportunity(capability: {
  id: string;
  name: string;
  module: string;
  description: string | null;
  assessment: {
    maturityTier: Maturity;
    rationale: string;
    agentTypeLabel: string;
    repeatabilityScore: number;
    roiScore: number;
    dataAvailabilityScore: number;
    riskScore: number;
    compositeOpportunityScore: number;
    impactTags: string[];
    weeklyHoursWasted: number;
    yearlyHoursWasted: number;
    annualDollarImpact: number;
  } | null;
  roadmapRecommendations: Array<{
    summary: string;
  }>;
}) {
  const recommendation = capability.roadmapRecommendations[0]?.summary ?? "";
  const assessment = capability.assessment;

  return {
    id: capability.id,
    title: capability.name,
    module: capability.module,
    description: capability.description ?? "",
    gapTitle: `${capability.module} execution gap`,
    gapDescription: assessment?.rationale ?? "",
    recommendation,
    agentType: assessment?.agentTypeLabel ?? "",
    maturity: assessment?.maturityTier ?? "NON_AGENTIC",
    tags: assessment?.impactTags ?? [],
    scores: {
      repeatability: assessment?.repeatabilityScore ?? 0,
      roiPotential: assessment?.roiScore ?? 0,
      dataAvailability: assessment?.dataAvailabilityScore ?? 0,
      risk: assessment?.riskScore ?? 0,
    },
    impact: {
      weeklyHoursSaved: assessment?.weeklyHoursWasted ?? 0,
      yearlyHoursSaved: assessment?.yearlyHoursWasted ?? 0,
      annualDollarValue: assessment?.annualDollarImpact ?? 0,
    },
    priorityScore: assessment?.compositeOpportunityScore ?? 0,
  } satisfies OpportunityResponse;
}

async function getLatestCompletedJob(workspaceId: string) {
  return prisma.extractionJob.findFirst({
    where: {
      workspaceId,
      status: "COMPLETED",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

export async function listWorkspaceOpportunities(input: {
  workspaceId: string;
  search?: string;
  module?: string;
  maturity?: Maturity;
  sort?: OpportunitySort;
}) {
  const latestJob = await getLatestCompletedJob(input.workspaceId);

  if (!latestJob) {
    return [];
  }

  const capabilities = await prisma.capability.findMany({
    where: {
      workspaceId: input.workspaceId,
      extractionJobId: latestJob.id,
      ...(input.module ? { module: input.module } : {}),
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
              { module: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(input.maturity
        ? {
            assessment: {
              is: {
                maturityTier: input.maturity,
              },
            },
          }
        : {}),
    },
    include: {
      assessment: true,
      roadmapRecommendations: {
        orderBy: {
          priority: "desc",
        },
        take: 1,
      },
    },
  });

  const opportunities = capabilities.map(mapOpportunity);

  return opportunities.sort((left, right) => {
    if (input.sort === "risk") {
      return right.scores.risk - left.scores.risk;
    }

    if (input.sort === "roi") {
      return right.scores.roiPotential - left.scores.roiPotential;
    }

    return right.priorityScore - left.priorityScore;
  });
}

export async function getWorkspaceOpportunityDetail(input: {
  workspaceId: string;
  opportunityId: string;
}) {
  const capability = await prisma.capability.findFirst({
    where: {
      id: input.opportunityId,
      workspaceId: input.workspaceId,
    },
    include: {
      assessment: true,
      roadmapRecommendations: {
        orderBy: {
          priority: "desc",
        },
      },
      features: {
        include: {
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
                },
              },
            },
          },
        },
      },
    },
  });

  if (!capability) {
    return null;
  }

  const base = mapOpportunity(capability);
  const scoreExplanations = asRecord(capability.assessment?.scoreExplanations);
  const implementationGuidance = asRecord(
    capability.assessment?.implementationGuidance
  );

  return {
    ...base,
    summary: capability.summaryNarrative ?? "",
    evidence: capability.features.map((feature) => ({
      featureId: feature.id,
      featureTitle: feature.title,
      excerpts: feature.sources
        .map((source) => source.excerpt)
        .filter((excerpt): excerpt is string => Boolean(excerpt)),
      sources: feature.sources.map((source) => ({
        documentId: source.document.id,
        documentTitle: source.document.title,
        sourceId: source.source?.id ?? null,
        sourceName: source.source?.name ?? null,
      })),
    })),
    explanations: {
      rationale: capability.assessment?.rationale ?? "",
      scoreExplanations: {
        repeatability: asString(scoreExplanations.repeatability),
        roiPotential: asString(scoreExplanations.roiPotential),
        dataAvailability: asString(scoreExplanations.dataAvailability),
        risk: asString(scoreExplanations.risk),
        priorityScore: asString(scoreExplanations.priorityScore),
      },
      implementationGuidance,
    },
  } satisfies OpportunityDetail;
}

export async function listWorkspaceModuleSummaries(workspaceId: string) {
  const latestJob = await getLatestCompletedJob(workspaceId);

  if (!latestJob) {
    return [] satisfies ModuleSummary[];
  }

  const capabilities = await prisma.capability.findMany({
    where: {
      workspaceId,
      extractionJobId: latestJob.id,
    },
    include: {
      assessment: true,
      features: {
        select: {
          id: true,
        },
      },
    },
  });

  const byModule = new Map<string, typeof capabilities>();

  for (const capability of capabilities) {
    const current = byModule.get(capability.module) ?? [];
    current.push(capability);
    byModule.set(capability.module, current);
  }

  return Array.from(byModule.entries())
    .map(([module, moduleCapabilities]) => ({
      name: module,
      featureCount: moduleCapabilities.reduce(
        (sum, capability) => sum + capability.features.length,
        0
      ),
      gapCount: moduleCapabilities.length,
      hoursAtRisk: moduleCapabilities.reduce(
        (sum, capability) => sum + (capability.assessment?.weeklyHoursWasted ?? 0),
        0
      ),
      opportunityScore: Math.round(
        moduleCapabilities.reduce(
          (sum, capability) =>
            sum + (capability.assessment?.compositeOpportunityScore ?? 0),
          0
        ) / Math.max(1, moduleCapabilities.length)
      ),
      narrative: `${module} has ${moduleCapabilities.length} persisted automation opportunit${
        moduleCapabilities.length === 1 ? "y" : "ies"
      } in the latest run.`,
    }))
    .sort((left, right) => right.opportunityScore - left.opportunityScore);
}

export async function getWorkspaceDashboard(workspaceId: string) {
  const latestJob = await getLatestCompletedJob(workspaceId);

  if (!latestJob) {
    return null;
  }

  const snapshot = await prisma.dashboardSnapshot.findUnique({
    where: {
      extractionJobId: latestJob.id,
    },
  });

  if (!snapshot) {
    return null;
  }

  const opportunities = await listWorkspaceOpportunities({
    workspaceId,
    sort: "priority",
  });
  const quickWins = opportunities.filter((item) => item.tags.includes("Lower implementation risk"));
  const moduleBreakdown = await listWorkspaceModuleSummaries(workspaceId);
  const topOpportunities = opportunities.slice(0, 5);

  return {
    totals: {
      features: moduleBreakdown.reduce((sum, row) => sum + row.featureCount, 0),
      gaps: moduleBreakdown.reduce((sum, row) => sum + row.gapCount, 0),
      partial: opportunities.filter((item) => item.maturity === "PARTIAL").length,
      automated: opportunities.filter((item) => item.maturity === "AGENTIC").length,
      hoursPerWeek: opportunities.reduce(
        (sum, item) => sum + item.impact.weeklyHoursSaved,
        0
      ),
    },
    moduleBreakdown,
    topOpportunities,
    quickWins: quickWins.slice(0, 5),
    riskRegister: opportunities.slice(0, 5).map((item) => ({
      title: item.title,
      severity: getSeverity(item.scores.risk),
      summary: item.recommendation,
    })),
  } satisfies DashboardResponse;
}
