type PipelineFeatureInput = {
  id: string;
  title: string;
  description: string | null;
  module: string | null;
  confidenceScore: number;
  tags: string[];
  sourceCount: number;
  excerpts: string[];
};

type MaturityTier = "NON_AGENTIC" | "PARTIAL" | "AGENTIC";

type CapabilityRecord = {
  featureIds: string[];
  name: string;
  module: string;
  description: string;
  extractedFeatureCount: number;
  hiddenFeatureEstimate: number;
  currentMaturityTier: MaturityTier;
  confidenceAvg: number;
  summaryNarrative: string;
  assessment: {
    maturityTier: MaturityTier;
    rationale: string;
    complexityScore: number;
    agentTypeLabel: string;
    weeklyHoursWasted: number;
    yearlyHoursWasted: number;
    annualDollarImpact: number;
    repeatabilityScore: number;
    roiScore: number;
    dataAvailabilityScore: number;
    riskScore: number;
    compositeOpportunityScore: number;
    impactTags: string[];
    scoreExplanations: Record<string, string>;
    implementationGuidance: {
      scoreGuide: string;
      cardSummary: string;
      ingestNarrative: string;
      featureTabNarrative: string;
    };
  };
};

type RoadmapRecommendationRecord = {
  capabilityModule: string;
  priority: number;
  phase: string;
  title: string;
  summary: string;
  quickWin: boolean;
  kpisJson: string[];
  risksJson: string[];
  breakEvenMonths: number;
  implementationNotes: string;
};

type DashboardSnapshotRecord = {
  kpiJson: Array<{ label: string; value: string; helper: string }>;
  moduleBreakdownJson: Array<{
    module: string;
    capabilityCount: number;
    featureCount: number;
    weeklyHoursWasted: number;
    opportunityScore: number;
    narrative: string;
  }>;
  donutChartJson: Array<{ label: string; value: number; helper: string }>;
  topOpportunitiesJson: Array<{
    capability: string;
    module: string;
    score: number;
    annualDollarImpact: number;
    rationale: string;
  }>;
  roadmapStatsJson: Array<{ label: string; value: number; helper: string }>;
  riskRegisterJson: Array<{ title: string; severity: string; mitigation: string }>;
  quickWinsJson: Array<{ title: string; summary: string; breakEvenMonths: number }>;
  uiCopyJson: {
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
};

export type PipelineAnalytics = {
  capabilities: CapabilityRecord[];
  roadmapRecommendations: RoadmapRecommendationRecord[];
  dashboardSnapshot: DashboardSnapshotRecord;
};

const HOURLY_RATE = 55;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function hasKeyword(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function pickAgentType(module: string, text: string) {
  if (hasKeyword(text, ["report", "dashboard", "insight", "metric"])) {
    return "Analytics copilot";
  }

  if (hasKeyword(text, ["review", "approval", "risk", "policy", "compliance"])) {
    return "Decision-support agent";
  }

  if (hasKeyword(text, ["sync", "monitor", "watch", "status", "notification"])) {
    return "Monitoring agent";
  }

  if (hasKeyword(text, ["upload", "extract", "parse", "ingest", "document"])) {
    return "Retrieval and workflow agent";
  }

  return `${module} automation agent`;
}

function computeMaturityTier(opportunityScore: number, dataAvailabilityScore: number) {
  if (opportunityScore >= 74 && dataAvailabilityScore >= 55) {
    return "AGENTIC" as const;
  }

  if (opportunityScore >= 48) {
    return "PARTIAL" as const;
  }

  return "NON_AGENTIC" as const;
}

function buildCapabilityNarrative(input: {
  module: string;
  featureCount: number;
  hiddenFeatureEstimate: number;
  weeklyHoursWasted: number;
  maturityTier: MaturityTier;
}) {
  return `${input.module} shows ${input.featureCount} extracted workflow signals with an estimated ${input.hiddenFeatureEstimate} hidden opportunities still outside explicit documentation. The current pattern is ${input.maturityTier.toLowerCase().replace("_", "-")} and likely burns ${input.weeklyHoursWasted} manual hours each week.`;
}

function buildAssessment(featureGroup: PipelineFeatureInput[], module: string) {
  const combinedText = featureGroup
    .flatMap((feature) => [feature.title, feature.description ?? "", ...feature.excerpts, ...feature.tags])
    .join(" ")
    .toLowerCase();
  const extractedFeatureCount = featureGroup.length;
  const confidenceAvg = average(featureGroup.map((feature) => feature.confidenceScore));
  const sourceDensity = average(featureGroup.map((feature) => feature.sourceCount * 22));
  const keywordBonus =
    (hasKeyword(combinedText, ["manual", "spreadsheet", "email", "copy", "handoff"]) ? 12 : 0) +
    (hasKeyword(combinedText, ["report", "dashboard", "analysis", "insight"]) ? 10 : 0) +
    (hasKeyword(combinedText, ["approval", "review", "risk", "audit"]) ? 8 : 0);
  const repeatabilityScore = clamp(38 + extractedFeatureCount * 12 + keywordBonus, 25, 95);
  const complexityScore = clamp(30 + extractedFeatureCount * 9 + Math.round(sourceDensity / 8), 28, 92);
  const dataAvailabilityScore = clamp(35 + sourceDensity + Math.round(confidenceAvg / 4), 25, 96);
  const riskScore = clamp(
    24 +
      (hasKeyword(combinedText, ["risk", "audit", "control", "compliance"]) ? 24 : 0) +
      (hasKeyword(combinedText, ["approval", "financial", "security"]) ? 14 : 0),
    18,
    88
  );
  const weeklyHoursWasted = clamp(
    extractedFeatureCount * 5 +
      Math.round(confidenceAvg / 12) +
      (hasKeyword(combinedText, ["manual", "review", "triage", "handoff"]) ? 7 : 3),
    6,
    120
  );
  const yearlyHoursWasted = weeklyHoursWasted * 52;
  const annualDollarImpact = yearlyHoursWasted * HOURLY_RATE;
  const roiScore = clamp(
    Math.round((weeklyHoursWasted * 1.6) + extractedFeatureCount * 6 - riskScore * 0.22),
    20,
    97
  );
  const compositeOpportunityScore = clamp(
    Math.round(
      repeatabilityScore * 0.3 +
        roiScore * 0.35 +
        dataAvailabilityScore * 0.2 +
        (100 - riskScore) * 0.15
    ),
    20,
    96
  );
  const maturityTier = computeMaturityTier(compositeOpportunityScore, dataAvailabilityScore);
  const hiddenFeatureEstimate = clamp(
    Math.round(extractedFeatureCount * (confidenceAvg >= 70 ? 0.45 : 0.35)),
    1,
    Math.max(1, extractedFeatureCount * 2)
  );
  const impactTags = unique(
    [
      repeatabilityScore >= 65 ? "repeatable-work" : null,
      roiScore >= 65 ? "strong-roi" : null,
      riskScore >= 55 ? "needs-controls" : null,
      dataAvailabilityScore >= 65 ? "data-ready" : null,
      maturityTier === "AGENTIC" ? "agentic-ready" : maturityTier === "PARTIAL" ? "partial-automation" : "foundation-gap",
    ].filter((value): value is string => Boolean(value))
  );
  const agentTypeLabel = pickAgentType(module, combinedText);
  const rationale = `${module} scored ${compositeOpportunityScore}/100 because the extracted work appears ${repeatabilityScore >= 65 ? "highly repeatable" : "partially repeatable"}, has ${dataAvailabilityScore >= 65 ? "usable" : "limited"} evidence coverage, and carries ${riskScore >= 55 ? "moderate control requirements" : "manageable delivery risk"}.`;

  return {
    extractedFeatureCount,
    hiddenFeatureEstimate,
    confidenceAvg,
    summaryNarrative: buildCapabilityNarrative({
      module,
      featureCount: extractedFeatureCount,
      hiddenFeatureEstimate,
      weeklyHoursWasted,
      maturityTier,
    }),
    assessment: {
      maturityTier,
      rationale,
      complexityScore,
      agentTypeLabel,
      weeklyHoursWasted,
      yearlyHoursWasted,
      annualDollarImpact,
      repeatabilityScore,
      roiScore,
      dataAvailabilityScore,
      riskScore,
      compositeOpportunityScore,
      impactTags,
      scoreExplanations: {
        repeatability: "Higher scores indicate work that follows a stable pattern and can be delegated to workflow or reasoning agents.",
        roi: "ROI reflects hours recoverable, likely adoption lift, and effort avoided after deployment.",
        dataAvailability: "Data availability measures whether the current source evidence is sufficient to train, prompt, or validate automation safely.",
        risk: "Risk captures approval gates, operational sensitivity, and the amount of oversight still required.",
      },
      implementationGuidance: {
        scoreGuide: "Treat 70+ as pipeline-ready, 50-69 as partial automation, and below 50 as a discovery backlog item.",
        cardSummary: `${agentTypeLabel} is the best-fit delivery pattern for this capability right now.`,
        ingestNarrative: `Expect ${hiddenFeatureEstimate} additional workflow gaps once adjacent documents and operational notes are included.`,
        featureTabNarrative: `Use ${weeklyHoursWasted} hours/week as the baseline for feature-level impact rollups in this module.`,
      },
    },
  };
}

export function buildPipelineAnalytics(features: PipelineFeatureInput[]): PipelineAnalytics {
  const grouped = features.reduce((map, feature) => {
    const key = feature.module || "General";
    const existing = map.get(key) ?? [];
    existing.push(feature);
    map.set(key, existing);
    return map;
  }, new Map<string, PipelineFeatureInput[]>());

  const capabilities = Array.from(grouped.entries())
    .map(([module, featureGroup]) => {
      const assessment = buildAssessment(featureGroup, module);

      return {
        featureIds: featureGroup.map((feature) => feature.id),
        name: `${module} capability`,
        module,
        description: featureGroup[0]?.description || `${module} automation opportunity synthesized from extracted workflow evidence.`,
        extractedFeatureCount: assessment.extractedFeatureCount,
        hiddenFeatureEstimate: assessment.hiddenFeatureEstimate,
        currentMaturityTier: assessment.assessment.maturityTier,
        confidenceAvg: assessment.confidenceAvg,
        summaryNarrative: assessment.summaryNarrative,
        assessment: assessment.assessment,
      };
    })
    .sort(
      (left, right) =>
        right.assessment.compositeOpportunityScore - left.assessment.compositeOpportunityScore
    );

  const roadmapRecommendations = capabilities.map((capability, index) => {
    const phase =
      capability.assessment.compositeOpportunityScore >= 75
        ? "Phase 1"
        : capability.assessment.compositeOpportunityScore >= 60
          ? "Phase 2"
          : "Phase 3";
    const quickWin =
      capability.assessment.roiScore >= 68 &&
      capability.assessment.complexityScore <= 65 &&
      capability.assessment.riskScore <= 58;
    const breakEvenMonths = clamp(
      Math.round(
        capability.assessment.complexityScore / 14 +
          (quickWin ? 1 : 2) +
          capability.assessment.riskScore / 45
      ),
      2,
      12
    );

    return {
      capabilityModule: capability.module,
      priority: index + 1,
      phase,
      title: `Automate ${capability.module.toLowerCase()} workflows`,
      summary: `${capability.assessment.agentTypeLabel} should reduce ${capability.assessment.weeklyHoursWasted} manual hours per week while improving ${capability.module.toLowerCase()} throughput.`,
      quickWin,
      kpisJson: [
        `Recover ${capability.assessment.weeklyHoursWasted} manual hours per week`,
        `Raise confidence-backed coverage to ${capability.hiddenFeatureEstimate + capability.extractedFeatureCount} tracked opportunities`,
      ],
      risksJson: [
        capability.assessment.riskScore >= 55
          ? "Keep an approval gate for higher-risk outputs until reviewers trust the model behavior."
          : "Add lightweight reviewer sampling during early rollout.",
        capability.assessment.dataAvailabilityScore < 60
          ? "Broaden evidence capture before full automation so the model has enough operational context."
          : "Define data contracts and refresh cadence for the connected sources.",
      ],
      breakEvenMonths,
      implementationNotes: `Start with ${capability.assessment.agentTypeLabel.toLowerCase()} patterns, then expand into ${capability.currentMaturityTier === "AGENTIC" ? "closed-loop actions" : "decision support"} once reviewer feedback stabilizes.`,
    };
  });

  const totalWeeklyHours = capabilities.reduce(
    (sum, capability) => sum + capability.assessment.weeklyHoursWasted,
    0
  );
  const totalAnnualImpact = capabilities.reduce(
    (sum, capability) => sum + capability.assessment.annualDollarImpact,
    0
  );
  const quickWins = roadmapRecommendations.filter((recommendation) => recommendation.quickWin);
  const maturityCounts = {
    NON_AGENTIC: capabilities.filter((item) => item.currentMaturityTier === "NON_AGENTIC").length,
    PARTIAL: capabilities.filter((item) => item.currentMaturityTier === "PARTIAL").length,
    AGENTIC: capabilities.filter((item) => item.currentMaturityTier === "AGENTIC").length,
  };

  return {
    capabilities,
    roadmapRecommendations,
    dashboardSnapshot: {
      kpiJson: [
        {
          label: "Capabilities assessed",
          value: String(capabilities.length),
          helper: "Grouped from extracted evidence and scored for roadmap readiness.",
        },
        {
          label: "Manual hours at risk / week",
          value: String(totalWeeklyHours),
          helper: "Estimated effort still absorbed by repetitive operational work.",
        },
        {
          label: "Annual value at stake",
          value: `$${totalAnnualImpact.toLocaleString()}`,
          helper: "Approximate recoverable labor value using a blended $55/hour model.",
        },
        {
          label: "Quick wins",
          value: String(quickWins.length),
          helper: "High-ROI initiatives that can break even within the first few months.",
        },
      ],
      moduleBreakdownJson: capabilities.map((capability) => ({
        module: capability.module,
        capabilityCount: 1,
        featureCount: capability.extractedFeatureCount,
        weeklyHoursWasted: capability.assessment.weeklyHoursWasted,
        opportunityScore: capability.assessment.compositeOpportunityScore,
        narrative: capability.summaryNarrative,
      })),
      donutChartJson: [
        {
          label: "Non-Agentic",
          value: maturityCounts.NON_AGENTIC,
          helper: "Work still needs foundational process or data cleanup before agentic automation.",
        },
        {
          label: "Partial",
          value: maturityCounts.PARTIAL,
          helper: "Good candidates for assistive copilots and reviewer-in-the-loop flows.",
        },
        {
          label: "Agentic",
          value: maturityCounts.AGENTIC,
          helper: "Strong candidates for autonomous orchestration with light oversight.",
        },
      ],
      topOpportunitiesJson: capabilities.slice(0, 5).map((capability) => ({
        capability: capability.name,
        module: capability.module,
        score: capability.assessment.compositeOpportunityScore,
        annualDollarImpact: capability.assessment.annualDollarImpact,
        rationale: capability.assessment.rationale,
      })),
      roadmapStatsJson: [
        {
          label: "Phase 1 initiatives",
          value: roadmapRecommendations.filter((item) => item.phase === "Phase 1").length,
          helper: "Highest-priority opportunities with strong readiness and ROI.",
        },
        {
          label: "Phase 2 initiatives",
          value: roadmapRecommendations.filter((item) => item.phase === "Phase 2").length,
          helper: "Valuable work that needs moderate process or data hardening first.",
        },
        {
          label: "Phase 3 initiatives",
          value: roadmapRecommendations.filter((item) => item.phase === "Phase 3").length,
          helper: "Longer-horizon bets that should stay visible in the roadmap backlog.",
        },
      ],
      riskRegisterJson: capabilities.slice(0, 5).map((capability) => ({
        title: `${capability.module} delivery risk`,
        severity:
          capability.assessment.riskScore >= 65
            ? "High"
            : capability.assessment.riskScore >= 45
              ? "Medium"
              : "Low",
        mitigation:
          capability.assessment.riskScore >= 65
            ? "Require human approval and audit logging until the workflow has enough live evidence."
            : "Monitor precision during rollout and sample-check outputs weekly.",
      })),
      quickWinsJson: quickWins.slice(0, 5).map((item) => ({
        title: item.title,
        summary: item.summary,
        breakEvenMonths: item.breakEvenMonths,
      })),
      uiCopyJson: {
        ingestTab: {
          featureInventory: "The inventory blends extracted evidence with a hidden-feature estimate so teams can see likely under-documented workflow gaps.",
          maturity: "Maturity tiers explain whether the work is still manual, ready for partial copilots, or strong enough for agent-led execution.",
          gapAnalysis: "Gap scoring combines repeatability, ROI, data readiness, and risk so each capability card carries a clear prioritization signal.",
          roadmap: "Roadmap outputs now include quick wins, KPIs, break-even timing, and delivery risks directly from the pipeline run.",
        },
        featuresTab: {
          scoreGuide: "Every card now needs score definitions, maturity rationale, and impact math so reviewers can defend prioritization decisions.",
          impactGuide: "Weekly hours, yearly effort, and annual value are stored as pipeline outputs rather than recomputed ad hoc in the UI.",
        },
        dashboardTab: {
          moduleBreakdown: "Dashboard modules are pre-aggregated per run so charts and summaries stay fast, reproducible, and auditable.",
          opportunities: "Top opportunities combine opportunity score, maturity, and annual value to surface the strongest next moves.",
          riskRegister: "Risk summaries are persisted with the snapshot so the dashboard can explain delivery constraints alongside upside.",
        },
      },
    },
  };
}
