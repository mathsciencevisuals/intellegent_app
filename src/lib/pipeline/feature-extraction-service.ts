import { buildMockFeatures } from "@/lib/features/mock-extraction";
import type { PipelineFeatureSeed } from "@/lib/pipeline/types";

export class FeatureExtractionService {
  extract(input: { documentTitle: string; extractedText: string | null }) {
    return buildMockFeatures(input) satisfies PipelineFeatureSeed[];
  }
}
