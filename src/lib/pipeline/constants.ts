export const PIPELINE_CONFIG = {
  version: "trust-v1",
  blendedHourlyRate: 65,
  workingWeeksPerYear: 50,
  conservativeRoiPenalty: 8,
  conservativeRiskBuffer: 8,
  priorityWeights: {
    roiPotential: 0.3,
    repeatability: 0.25,
    dataAvailability: 0.2,
    inverseRisk: 0.15,
    maturityGapBonus: 0.1,
  },
  roiWeights: {
    normalizedTimeSavings: 0.4,
    normalizedErrorReduction: 0.25,
    normalizedVolume: 0.2,
    normalizedStrategicValue: 0.15,
  },
  riskWeights: {
    regulatoryRisk: 0.35,
    exceptionComplexity: 0.25,
    accuracySensitivity: 0.2,
    changeManagementRisk: 0.2,
  },
  maturityGapBonus: {
    NON_AGENTIC: 20,
    PARTIAL: 10,
    AGENTIC: 0,
  },
} as const;

export const PIPELINE_DEFAULTS = {
  missingModuleName: "General",
  maxTopOpportunities: 5,
  maxQuickWins: 5,
} as const;
