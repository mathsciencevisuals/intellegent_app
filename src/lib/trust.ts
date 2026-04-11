import { PIPELINE_CONFIG } from "@/lib/pipeline/constants";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function getConfidenceLabel(score: number) {
  if (score >= 85) {
    return "High confidence";
  }

  if (score >= 65) {
    return "Moderate confidence";
  }

  return "Low confidence";
}

export function getConfidenceTone(score: number) {
  if (score >= 85) {
    return "emerald";
  }

  if (score >= 65) {
    return "amber";
  }

  return "red";
}

export function getConfidenceClasses(score: number) {
  const tone = getConfidenceTone(score);

  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

export function getReviewGuidance(score: number) {
  if (score >= 85) {
    return "Suitable for reviewer confirmation before planning or implementation.";
  }

  if (score >= 65) {
    return "Review supporting evidence and edge cases before treating this as roadmap input.";
  }

  return "Do not treat this as decision-ready until a human verifies the underlying evidence.";
}

export function getPipelineVersion() {
  return PIPELINE_CONFIG.version;
}

export function getConservativeRoiScore(score: number) {
  return clamp(score - PIPELINE_CONFIG.conservativeRoiPenalty);
}

export function getConservativeRiskScore(score: number) {
  return clamp(score + PIPELINE_CONFIG.conservativeRiskBuffer);
}
