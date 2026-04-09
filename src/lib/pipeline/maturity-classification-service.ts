import type { Maturity } from "@/lib/pipeline/types";

export function classifyMaturity(currentAutomationLevel: number): Maturity {
  if (currentAutomationLevel === 0) {
    return "NON_AGENTIC";
  }

  if (currentAutomationLevel > 0 && currentAutomationLevel < 0.8) {
    return "PARTIAL";
  }

  return "AGENTIC";
}

export class MaturityClassificationService {
  classify(currentAutomationLevel: number) {
    return classifyMaturity(currentAutomationLevel);
  }
}
