import type { GapRecord, NormalizedFeatureGroup } from "@/lib/pipeline/types";

export class GapDetectionService {
  detect(groups: NormalizedFeatureGroup[]) {
    return groups.map((group) => this.detectGroupGap(group));
  }

  private detectGroupGap(group: NormalizedFeatureGroup): GapRecord {
    const maturityLabel =
      group.currentAutomationLevel === 0
        ? "no existing automation"
        : group.currentAutomationLevel < 0.8
          ? "partial automation with human bottlenecks"
          : "automation that still benefits from exception handling";

    return {
      module: group.module,
      title: `${group.module} execution gap`,
      description: `${group.module} shows ${maturityLabel}. Extracted signals indicate repeated work that can be standardized into a more agentic flow.`,
      currentAutomationLevel: group.currentAutomationLevel,
    };
  }
}
