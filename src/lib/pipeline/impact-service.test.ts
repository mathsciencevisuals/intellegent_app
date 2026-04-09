import test from "node:test";
import assert from "node:assert/strict";

import { computeImpact, computeImpactTags } from "@/lib/pipeline/impact-service";

test("computeImpact uses 50 working weeks and default hourly rate", () => {
  const impact = computeImpact({
    weeklyHoursSaved: 12,
  });

  assert.deepEqual(impact, {
    weeklyHoursSaved: 12,
    yearlyHoursSaved: 600,
    annualDollarValue: 39000,
  });
});

test("computeImpactTags adds the expected tags", () => {
  const tags = computeImpactTags({
    weeklyHoursSaved: 8,
    risk: 40,
    roiPotential: 81,
    regulatoryRisk: 72,
    errorReductionScore: 76,
    volumeScore: 73,
  });

  assert.deepEqual(tags, [
    "Time savings",
    "Lower implementation risk",
    "High ROI",
    "Compliance",
    "Error reduction",
    "Scalability",
  ]);
});
