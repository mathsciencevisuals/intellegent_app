import { PIPELINE_DEFAULTS } from "@/lib/pipeline/constants";
import type {
  AutomationOpportunity,
  DashboardSnapshot,
  ModuleSummary,
  OpportunityResponse,
} from "@/lib/pipeline/types";

function toOpportunityResponse(
  opportunity: AutomationOpportunity
): OpportunityResponse {
  return {
    id: opportunity.id,
    title: opportunity.title,
    module: opportunity.module,
    description: opportunity.description,
    gapTitle: opportunity.gapTitle,
    gapDescription: opportunity.gapDescription,
    recommendation: opportunity.recommendation,
    agentType: opportunity.agentType,
    maturity: opportunity.maturity,
    tags: opportunity.tags,
    scores: opportunity.scores,
    impact: opportunity.impact,
    priorityScore: opportunity.priorityScore,
  };
}

function severityFromRisk(risk: number): "low" | "medium" | "high" {
  if (risk >= 70) {
    return "high";
  }

  if (risk >= 45) {
    return "medium";
  }

  return "low";
}

export class DashboardAggregationService {
  buildModuleSummaries(opportunities: AutomationOpportunity[]): ModuleSummary[] {
    const byModule = new Map<string, AutomationOpportunity[]>();

    for (const opportunity of opportunities) {
      const current = byModule.get(opportunity.module) ?? [];
      current.push(opportunity);
      byModule.set(opportunity.module, current);
    }

    return Array.from(byModule.entries())
      .map(([module, moduleOpportunities]) => {
        const featureCount = moduleOpportunities.reduce(
          (sum, opportunity) => sum + opportunity.evidenceFeatureIds.length,
          0
        );
        const hoursAtRisk = moduleOpportunities.reduce(
          (sum, opportunity) => sum + opportunity.impact.weeklyHoursSaved,
          0
        );
        const opportunityScore = Math.round(
          moduleOpportunities.reduce((sum, opportunity) => sum + opportunity.priorityScore, 0) /
            moduleOpportunities.length
        );

        return {
          name: module,
          featureCount,
          gapCount: moduleOpportunities.length,
          hoursAtRisk,
          opportunityScore,
          narrative: `${module} contains ${featureCount} workflow signals and ${hoursAtRisk} hours/week of recoverable effort.`,
        } satisfies ModuleSummary;
      })
      .sort((left, right) => right.opportunityScore - left.opportunityScore);
  }

  aggregate(opportunities: AutomationOpportunity[], moduleSummaries: ModuleSummary[]): DashboardSnapshot {
    const topOpportunities = opportunities
      .slice(0, PIPELINE_DEFAULTS.maxTopOpportunities)
      .map(toOpportunityResponse);
    const quickWins = opportunities
      .filter((opportunity) => opportunity.roadmap.quickWin)
      .slice(0, PIPELINE_DEFAULTS.maxQuickWins)
      .map(toOpportunityResponse);

    return {
      totals: {
        features: opportunities.reduce(
          (sum, opportunity) => sum + opportunity.evidenceFeatureIds.length,
          0
        ),
        gaps: opportunities.length,
        partial: opportunities.filter((opportunity) => opportunity.maturity === "PARTIAL")
          .length,
        automated: opportunities.filter((opportunity) => opportunity.maturity === "AGENTIC")
          .length,
        hoursPerWeek: opportunities.reduce(
          (sum, opportunity) => sum + opportunity.impact.weeklyHoursSaved,
          0
        ),
      },
      moduleBreakdown: moduleSummaries,
      topOpportunities,
      quickWins,
      riskRegister: opportunities.slice(0, 5).map((opportunity) => ({
        title: opportunity.title,
        severity: severityFromRisk(opportunity.scores.risk),
        summary: opportunity.roadmap.risks.join(", "),
      })),
      kpis: [
        {
          label: "Automation opportunities",
          value: String(opportunities.length),
          helper: "Deterministically scored from extracted feature evidence.",
        },
        {
          label: "Hours per week",
          value: String(
            opportunities.reduce(
              (sum, opportunity) => sum + opportunity.impact.weeklyHoursSaved,
              0
            )
          ),
          helper: "Estimated weekly manual effort that can be recovered.",
        },
        {
          label: "Quick wins",
          value: String(quickWins.length),
          helper: "Low-friction opportunities suitable for the first phase.",
        },
        {
          label: "Agentic ready",
          value: String(
            opportunities.filter((opportunity) => opportunity.maturity === "AGENTIC")
              .length
          ),
          helper: "Flows already near exception-based oversight.",
        },
      ],
      maturityMix: [
        {
          label: "Non-agentic",
          value: opportunities.filter((item) => item.maturity === "NON_AGENTIC").length,
          helper: "Manual end-to-end workflows.",
        },
        {
          label: "Partial",
          value: opportunities.filter((item) => item.maturity === "PARTIAL").length,
          helper: "Mixed automation with human execution or review.",
        },
        {
          label: "Agentic",
          value: opportunities.filter((item) => item.maturity === "AGENTIC").length,
          helper: "Routine flows that can move to exception-based oversight.",
        },
      ],
      roadmapStats: [
        {
          label: "Phase 1",
          value: opportunities.filter((item) => item.roadmap.phase === "Phase 1").length,
          helper: "Immediate implementation candidates.",
        },
        {
          label: "Phase 2",
          value: opportunities.filter((item) => item.roadmap.phase === "Phase 2").length,
          helper: "Follow-on workflow automation candidates.",
        },
        {
          label: "High risk",
          value: opportunities.filter((item) => item.scores.risk >= 70).length,
          helper: "Requires stronger controls or sign-off.",
        },
      ],
      uiCopy: {
        ingestTab: {
          featureInventory:
            "Parsed evidence is normalized into module-level opportunities so extracted features can be reviewed alongside automation potential.",
          maturity:
            "Maturity reflects the current automation level of each workflow before recommendations are applied.",
          gapAnalysis:
            "Gap detection highlights where manual execution, exception handling, or fragmented data still block agentic delivery.",
          roadmap:
            "Recommendations, priority, and break-even estimates are stored per run for repeatable dashboard reads.",
        },
        featuresTab: {
          scoreGuide:
            "Priority combines ROI, repeatability, data availability, inverse risk, and maturity gap using deterministic weights.",
          impactGuide:
            "Annual value uses 50 working weeks and the configured blended hourly rate for conservative business estimates.",
        },
        dashboardTab: {
          moduleBreakdown:
            "Modules are ranked by recoverable hours and opportunity score so delivery can sequence work by impact.",
          opportunities:
            "Top opportunities are the highest-priority module-level recommendations from the latest persisted run.",
          riskRegister:
            "Risk register entries summarize the main implementation controls required for each opportunity.",
        },
      },
    };
  }
}
