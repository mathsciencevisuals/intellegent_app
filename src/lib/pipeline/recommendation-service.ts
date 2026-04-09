import type {
  GapRecord,
  NormalizedFeatureGroup,
  RecommendationRecord,
} from "@/lib/pipeline/types";

function hasKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function pickAgentType(text: string, module: string) {
  if (hasKeyword(text, ["dashboard", "report", "metric", "analysis"])) {
    return "Analytics copilot";
  }

  if (hasKeyword(text, ["review", "approval", "policy", "compliance", "risk"])) {
    return "Decision-support agent";
  }

  if (hasKeyword(text, ["sync", "watch", "status", "alert", "monitor"])) {
    return "Monitoring agent";
  }

  if (hasKeyword(text, ["parse", "extract", "intake", "document", "upload"])) {
    return "Retrieval and workflow agent";
  }

  return `${module} automation agent`;
}

export class RecommendationService {
  recommend(input: {
    groups: NormalizedFeatureGroup[];
    gaps: GapRecord[];
  }) {
    return input.groups.map((group) => {
      const gap = input.gaps.find((item) => item.module === group.module);
      const combinedText = group.features
        .flatMap((feature) => [feature.title, feature.description ?? "", ...feature.tags])
        .join(" ")
        .toLowerCase();
      const agentType = pickAgentType(combinedText, group.module);
      const quickWin = group.currentAutomationLevel < 0.8 && group.sourceCoverageScore >= 60;
      const phase =
        group.weeklyHoursSaved >= 18 ? "Phase 1" : quickWin ? "Phase 1" : "Phase 2";
      const breakEvenMonths = Math.max(
        1,
        Math.round((quickWin ? 2 : 4) + group.exceptionComplexity / 40)
      );

      return {
        module: group.module,
        recommendation: `Deploy a ${agentType.toLowerCase()} for ${group.module.toLowerCase()} to close the ${gap?.title.toLowerCase() ?? "workflow gap"} and standardize exception handling.`,
        summary: `Prioritize ${group.module.toLowerCase()} because the workload is repeatable, evidence-backed, and sized for ${group.weeklyHoursSaved} hours/week of recoverable capacity.`,
        agentType,
        phase,
        quickWin,
        kpis: [
          "Hours saved per week",
          "Exception rate",
          "Cycle time reduction",
        ],
        risks: group.regulatoryRisk >= 70
          ? ["Compliance sign-off required", "Audit trail coverage"]
          : ["Change adoption", "Fallback workflow coverage"],
        implementationNotes: `Start with ${group.features.length} evidence-backed workflow signals in ${group.module} and keep humans on exception review until the exception path stabilizes.`,
        breakEvenMonths,
      } satisfies RecommendationRecord;
    });
  }
}
