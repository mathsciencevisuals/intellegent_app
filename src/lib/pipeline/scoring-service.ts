import { PIPELINE_CONFIG } from "@/lib/pipeline/constants";
import type { Maturity, OpportunityScores } from "@/lib/pipeline/types";

type RepeatabilityInput = {
  featureCount: number;
  averageConfidence: number;
  exceptionComplexity: number;
  judgmentSignals: number;
  manualSignals: number;
};

type RoiInput = {
  normalizedTimeSavings: number;
  normalizedErrorReduction: number;
  normalizedVolume: number;
  normalizedStrategicValue: number;
};

type DataAvailabilityInput = {
  structuredDataScore: number;
  sourceCoverageScore: number;
  confidenceScore: number;
};

type RiskInput = {
  regulatoryRisk: number;
  exceptionComplexity: number;
  accuracySensitivity: number;
  changeManagementRisk: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value);
}

export function computeRepeatabilityScore(input: RepeatabilityInput) {
  const repeatability = 35 +
    input.featureCount * 10 +
    Math.round(input.averageConfidence * 0.18) +
    Math.round(input.manualSignals * 0.22) -
    Math.round(input.exceptionComplexity * 0.35) -
    Math.round(input.judgmentSignals * 0.2);

  return clamp(round(repeatability));
}

export function computeRoiPotential(input: RoiInput) {
  const { roiWeights } = PIPELINE_CONFIG;

  return clamp(
    round(
      roiWeights.normalizedTimeSavings * input.normalizedTimeSavings +
        roiWeights.normalizedErrorReduction * input.normalizedErrorReduction +
        roiWeights.normalizedVolume * input.normalizedVolume +
        roiWeights.normalizedStrategicValue * input.normalizedStrategicValue -
        PIPELINE_CONFIG.conservativeRoiPenalty
    )
  );
}

export function computeDataAvailabilityScore(input: DataAvailabilityInput) {
  const score =
    input.structuredDataScore * 0.45 +
    input.sourceCoverageScore * 0.35 +
    input.confidenceScore * 0.2;

  return clamp(round(score));
}

export function computeRiskScore(input: RiskInput) {
  const { riskWeights } = PIPELINE_CONFIG;

  return clamp(
    round(
      riskWeights.regulatoryRisk * input.regulatoryRisk +
        riskWeights.exceptionComplexity * input.exceptionComplexity +
        riskWeights.accuracySensitivity * input.accuracySensitivity +
        riskWeights.changeManagementRisk * input.changeManagementRisk +
        PIPELINE_CONFIG.conservativeRiskBuffer
    )
  );
}

export function computePriorityScore(input: {
  scores: OpportunityScores;
  maturity: Maturity;
}) {
  const { priorityWeights, maturityGapBonus } = PIPELINE_CONFIG;

  return clamp(
    round(
      priorityWeights.roiPotential * input.scores.roiPotential +
        priorityWeights.repeatability * input.scores.repeatability +
        priorityWeights.dataAvailability * input.scores.dataAvailability +
        priorityWeights.inverseRisk * (100 - input.scores.risk) +
        priorityWeights.maturityGapBonus * maturityGapBonus[input.maturity]
    )
  );
}

export class ScoringService {
  computeScores(input: {
    featureCount: number;
    averageConfidence: number;
    manualSignals: number;
    judgmentSignals: number;
    normalizedTimeSavings: number;
    normalizedErrorReduction: number;
    normalizedVolume: number;
    normalizedStrategicValue: number;
    structuredDataScore: number;
    sourceCoverageScore: number;
    regulatoryRisk: number;
    exceptionComplexity: number;
    accuracySensitivity: number;
    changeManagementRisk: number;
  }): OpportunityScores {
    return {
      repeatability: computeRepeatabilityScore({
        featureCount: input.featureCount,
        averageConfidence: input.averageConfidence,
        exceptionComplexity: input.exceptionComplexity,
        judgmentSignals: input.judgmentSignals,
        manualSignals: input.manualSignals,
      }),
      roiPotential: computeRoiPotential({
        normalizedTimeSavings: input.normalizedTimeSavings,
        normalizedErrorReduction: input.normalizedErrorReduction,
        normalizedVolume: input.normalizedVolume,
        normalizedStrategicValue: input.normalizedStrategicValue,
      }),
      dataAvailability: computeDataAvailabilityScore({
        structuredDataScore: input.structuredDataScore,
        sourceCoverageScore: input.sourceCoverageScore,
        confidenceScore: input.averageConfidence,
      }),
      risk: computeRiskScore({
        regulatoryRisk: input.regulatoryRisk,
        exceptionComplexity: input.exceptionComplexity,
        accuracySensitivity: input.accuracySensitivity,
        changeManagementRisk: input.changeManagementRisk,
      }),
    };
  }
}
