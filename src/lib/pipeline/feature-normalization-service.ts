import { PIPELINE_DEFAULTS } from "@/lib/pipeline/constants";
import type {
  NormalizedFeatureGroup,
  PipelineFeature,
} from "@/lib/pipeline/types";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function hasKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeModule(module: string | null | undefined) {
  const value = module?.trim();
  return value ? value : PIPELINE_DEFAULTS.missingModuleName;
}

export class FeatureNormalizationService {
  normalize(features: PipelineFeature[]) {
    const groups = new Map<string, PipelineFeature[]>();

    for (const feature of features) {
      const moduleName = normalizeModule(feature.module);
      const normalizedFeature = { ...feature, module: moduleName };
      const current = groups.get(moduleName) ?? [];
      current.push(normalizedFeature);
      groups.set(moduleName, current);
    }

    return Array.from(groups.entries())
      .map(([module, moduleFeatures]) => this.buildGroup(module, moduleFeatures))
      .sort((left, right) => right.weeklyHoursSaved - left.weeklyHoursSaved);
  }

  private buildGroup(module: string, features: PipelineFeature[]): NormalizedFeatureGroup {
    const combinedText = features
      .flatMap((feature) => [
        feature.title,
        feature.description ?? "",
        ...feature.tags,
        ...feature.excerpts,
      ])
      .join(" ")
      .toLowerCase();
    const averageConfidence = average(features.map((feature) => feature.confidenceScore));
    const sourceCoverageScore = clamp(
      average(features.map((feature) => feature.sourceCount * 28))
    );
    const featureCount = features.length;
    const manualSignals =
      (hasKeyword(combinedText, ["manual", "email", "spreadsheet", "handoff", "copy"]) ? 28 : 12) +
      featureCount * 6;
    const judgmentSignals = hasKeyword(combinedText, [
      "review",
      "approve",
      "decision",
      "judgment",
      "escalation",
    ])
      ? 70
      : 32;
    const currentAutomationLevel = clamp(
      Number(
        (
          averageConfidence / 100 * 0.35 +
          sourceCoverageScore / 100 * 0.2 -
          manualSignals / 100 * 0.25 -
          judgmentSignals / 100 * 0.15 +
          0.35
        ).toFixed(2)
      ),
      0,
      1
    );
    const weeklyHoursSaved = Math.max(
      2,
      Math.round(featureCount * 4 + averageConfidence / 10 + manualSignals / 8)
    );

    return {
      module,
      title: `${module} automation opportunity`,
      description: `Automate repeatable ${module.toLowerCase()} work currently spread across extracted workflow signals.`,
      featureIds: features.map((feature) => feature.id),
      features,
      averageConfidence,
      sourceCoverageScore,
      currentAutomationLevel,
      weeklyHoursSaved,
      errorReductionScore: clamp(
        averageConfidence + (hasKeyword(combinedText, ["error", "audit", "rework"]) ? 14 : 0)
      ),
      volumeScore: clamp(featureCount * 14 + (sourceCoverageScore >= 70 ? 16 : 0)),
      strategicValueScore: clamp(
        40 +
          (hasKeyword(combinedText, ["revenue", "customer", "sla", "compliance"]) ? 30 : 10) +
          featureCount * 4
      ),
      regulatoryRisk: clamp(
        hasKeyword(combinedText, ["policy", "compliance", "audit", "finance", "security"])
          ? 78
          : 32
      ),
      exceptionComplexity: clamp(
        30 + (judgmentSignals >= 70 ? 26 : 8) + Math.round((100 - averageConfidence) * 0.2)
      ),
      accuracySensitivity: clamp(
        hasKeyword(combinedText, ["legal", "financial", "customer", "risk"])
          ? 74
          : 42
      ),
      changeManagementRisk: clamp(28 + featureCount * 5),
      dataStructureScore: clamp(
        sourceCoverageScore * 0.6 + averageConfidence * 0.4
      ),
    };
  }
}
