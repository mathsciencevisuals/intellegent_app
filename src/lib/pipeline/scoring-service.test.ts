import test from "node:test";
import assert from "node:assert/strict";

import {
  ScoringService,
  computePriorityScore,
  computeRoiPotential,
  computeRiskScore,
} from "@/lib/pipeline/scoring-service";

test("computeRoiPotential applies the configured weighted formula", () => {
  const score = computeRoiPotential({
    normalizedTimeSavings: 80,
    normalizedErrorReduction: 60,
    normalizedVolume: 50,
    normalizedStrategicValue: 40,
  });

  assert.equal(score, 55);
});

test("computeRiskScore applies the configured weighted formula", () => {
  const score = computeRiskScore({
    regulatoryRisk: 80,
    exceptionComplexity: 60,
    accuracySensitivity: 70,
    changeManagementRisk: 50,
  });

  assert.equal(score, 75);
});

test("computePriorityScore includes maturity gap bonus", () => {
  const nonAgentic = computePriorityScore({
    maturity: "NON_AGENTIC",
    scores: {
      repeatability: 80,
      roiPotential: 75,
      dataAvailability: 70,
      risk: 30,
    },
  });
  const agentic = computePriorityScore({
    maturity: "AGENTIC",
    scores: {
      repeatability: 80,
      roiPotential: 75,
      dataAvailability: 70,
      risk: 30,
    },
  });

  assert.equal(nonAgentic, 69);
  assert.equal(agentic, 67);
});

test("ScoringService returns deterministic bounded scores", () => {
  const service = new ScoringService();

  const scores = service.computeScores({
    featureCount: 3,
    averageConfidence: 78,
    manualSignals: 82,
    judgmentSignals: 40,
    normalizedTimeSavings: 88,
    normalizedErrorReduction: 74,
    normalizedVolume: 69,
    normalizedStrategicValue: 55,
    structuredDataScore: 71,
    sourceCoverageScore: 67,
    regulatoryRisk: 35,
    exceptionComplexity: 42,
    accuracySensitivity: 38,
    changeManagementRisk: 30,
  });

  assert.deepEqual(scores, {
    repeatability: 74,
    roiPotential: 68,
    dataAvailability: 71,
    risk: 44,
  });
});
