import type { AnalysisFeature, AnalysisResult, RoadmapKpi, RoadmapPhase, RoadmapResult, RoadmapRisk } from "@/lib/analysis-service";
import type { AutomationOpportunity, PipelineOutput } from "@/lib/pipeline/types";

function toAnalysisStatus(maturity: AutomationOpportunity["maturity"]): AnalysisFeature["status"] {
  switch (maturity) {
    case "AGENTIC":
      return "agentic";
    case "PARTIAL":
      return "partial";
    default:
      return "none";
  }
}

function toComplexity(score: number): AnalysisFeature["complexity"] {
  if (score >= 70) {
    return "High";
  }

  if (score >= 40) {
    return "Medium";
  }

  return "Low";
}

function formatPhaseTitle(phase: string) {
  return phase
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildRoadmapPhases(opportunities: AutomationOpportunity[]): RoadmapPhase[] {
  const grouped = new Map<string, AutomationOpportunity[]>();

  for (const opportunity of opportunities) {
    const phaseKey = opportunity.roadmap.phase || "Phase 1";
    const bucket = grouped.get(phaseKey);

    if (bucket) {
      bucket.push(opportunity);
      continue;
    }

    grouped.set(phaseKey, [opportunity]);
  }

  return Array.from(grouped.entries()).map(([phaseKey, items], index) => ({
    phase: index + 1,
    title: formatPhaseTitle(phaseKey),
    duration_weeks: Math.max(2, items.length * 2),
    features: items.map((item) => item.title),
    outcome:
      items[0]?.summary ??
      `Advance ${items.length} automation opportunity${items.length === 1 ? "" : "ies"} in this phase.`,
    effort: toComplexity(
      Math.round(items.reduce((sum, item) => sum + item.scores.risk, 0) / Math.max(1, items.length))
    ),
    dependencies: items
      .map((item) => item.roadmap.implementationNotes)
      .find((note) => note.trim().length > 0) ?? "Reviewer confirmation and source validation.",
  }));
}

function buildRoadmapRisks(opportunities: AutomationOpportunity[]): RoadmapRisk[] {
  const risks = opportunities
    .flatMap((opportunity) =>
      opportunity.roadmap.risks.map((risk) => ({
        risk,
        mitigation: opportunity.roadmap.implementationNotes || opportunity.summary,
        severity: toComplexity(opportunity.scores.risk),
      }))
    )
    .slice(0, 6);

  if (risks.length > 0) {
    return risks;
  }

  return [
    {
      risk: "Evidence coverage remains limited for some generated features.",
      mitigation: "Review linked excerpts before approving roadmap commitments.",
      severity: "Medium",
    },
  ];
}

function buildRoadmapKpis(opportunities: AutomationOpportunity[]): RoadmapKpi[] {
  const kpis = opportunities
    .flatMap((opportunity) =>
      opportunity.roadmap.kpis.map((metric) => ({
        metric,
        baseline: "Current manual or partially automated workflow",
        target: `Improve ${opportunity.title.toLowerCase()} outcomes`,
        timeline: opportunity.roadmap.phase || "Next phase",
        owner: "Workspace reviewer",
      }))
    )
    .slice(0, 6);

  if (kpis.length > 0) {
    return kpis;
  }

  return [
    {
      metric: "Validated automation opportunities",
      baseline: "0 reviewed recommendations",
      target: `${Math.max(1, opportunities.length)} reviewed recommendations`,
      timeline: "Current review cycle",
      owner: "Workspace reviewer",
    },
  ];
}

export function buildDocumentAnalysisFromPipeline(
  documentTitle: string,
  output: PipelineOutput
): {
  analysisResult: AnalysisResult;
  roadmapResult: RoadmapResult;
} {
  const opportunityByFeatureId = new Map(
    output.opportunities.flatMap((opportunity) =>
      opportunity.evidenceFeatureIds.map((featureId) => [featureId, opportunity] as const)
    )
  );
  const modules = Array.from(
    new Set(output.features.map((item) => item.module).filter(Boolean))
  );
  const analysisFeatures: AnalysisFeature[] = output.features.map((feature, index) => {
    const opportunity = opportunityByFeatureId.get(feature.id);

    return {
      id: index + 1,
      module: feature.module,
      name: feature.title,
      status: opportunity ? toAnalysisStatus(opportunity.maturity) : "partial",
      confidence_score: feature.confidenceScore,
      current: feature.description ?? feature.title,
      gap:
        opportunity?.gapDescription ??
        `Review ${feature.module.toLowerCase()} workflow details before promoting this extracted feature into roadmap planning.`,
      recommendation:
        opportunity?.recommendation ??
        `Validate this extracted feature with a reviewer before turning it into an automation recommendation.`,
      agent_type: opportunity?.agentType ?? `${feature.module} automation agent`,
      impact: feature.tags,
      hours_saved_weekly: opportunity?.impact.weeklyHoursSaved ?? Math.max(2, feature.sourceCount * 4),
      complexity: toComplexity(opportunity?.priorityScore ?? feature.confidenceScore),
      scores: {
        repeatability: opportunity?.scores.repeatability ?? Math.min(100, 35 + feature.sourceCount * 15),
        roi: opportunity?.scores.roiPotential ?? Math.min(100, 30 + feature.confidenceScore),
        dataAvail:
          opportunity?.scores.dataAvailability ??
          Math.min(100, Math.round(feature.confidenceScore * 0.7 + feature.sourceCount * 12)),
        risk: opportunity?.scores.risk ?? 45,
      },
    };
  });
  const totalWeeks = Math.max(4, buildRoadmapPhases(output.opportunities).reduce((sum, phase) => sum + phase.duration_weeks, 0));

  return {
    analysisResult: {
      product_name: documentTitle,
      summary:
        output.dashboardSnapshot.uiCopy.ingestTab.featureInventory ||
        `Generated ${analysisFeatures.length} workflow feature candidate${analysisFeatures.length === 1 ? "" : "s"} from the current document.`,
      industry: modules[0] ?? "General",
      modules,
      features: analysisFeatures,
    },
    roadmapResult: {
      exec_summary:
        output.dashboardSnapshot.uiCopy.ingestTab.roadmap ||
        `Prioritize quick wins first, then sequence higher-value integrations after reviewer validation.`,
      total_effort_weeks: totalWeeks,
      roi_projection: `${output.dashboardSnapshot.totals.hoursPerWeek} weekly hours are currently exposed across identified opportunities.`,
      time_savings_weekly: output.dashboardSnapshot.totals.hoursPerWeek,
      phases: buildRoadmapPhases(output.opportunities),
      risks: buildRoadmapRisks(output.opportunities),
      quick_wins: output.dashboardSnapshot.quickWins.map((item) => item.title),
      kpis: buildRoadmapKpis(output.opportunities),
      investment_estimate: output.opportunities.length >= 6 ? "Medium to high investment" : "Low to medium investment",
      break_even_months:
        output.opportunities.length > 0
          ? Math.max(
              1,
              Math.round(
                output.opportunities.reduce((sum, item) => sum + item.roadmap.breakEvenMonths, 0) /
                  output.opportunities.length
              )
            )
          : 3,
    },
  };
}
