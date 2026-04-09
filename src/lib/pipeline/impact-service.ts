import { PIPELINE_CONFIG } from "@/lib/pipeline/constants";
import type { OpportunityImpact } from "@/lib/pipeline/types";

function round(value: number) {
  return Math.round(value);
}

export function computeImpact(input: {
  weeklyHoursSaved: number;
  blendedHourlyRate?: number;
}): OpportunityImpact {
  const yearlyHoursSaved = round(
    input.weeklyHoursSaved * PIPELINE_CONFIG.workingWeeksPerYear
  );
  const annualDollarValue = round(
    yearlyHoursSaved *
      (input.blendedHourlyRate ?? PIPELINE_CONFIG.blendedHourlyRate)
  );

  return {
    weeklyHoursSaved: round(input.weeklyHoursSaved),
    yearlyHoursSaved,
    annualDollarValue,
  };
}

export function computeImpactTags(input: {
  weeklyHoursSaved: number;
  risk: number;
  roiPotential: number;
  regulatoryRisk: number;
  errorReductionScore: number;
  volumeScore: number;
}) {
  const tags: string[] = [];

  if (input.weeklyHoursSaved >= 5) {
    tags.push("Time savings");
  }

  if (input.risk <= 45) {
    tags.push("Lower implementation risk");
  }

  if (input.roiPotential >= 75) {
    tags.push("High ROI");
  }

  if (input.regulatoryRisk >= 70) {
    tags.push("Compliance");
  }

  if (input.errorReductionScore >= 70) {
    tags.push("Error reduction");
  }

  if (input.volumeScore >= 70) {
    tags.push("Scalability");
  }

  return tags;
}

export class ImpactService {
  compute = computeImpact;
  computeTags = computeImpactTags;
}
