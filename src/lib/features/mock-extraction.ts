type ExtractedFeatureCandidate = {
  title: string;
  description: string;
  module: string;
  confidenceScore: number;
  tags: string[];
  excerpt: string;
};

function toSentences(text: string) {
  return text
    .split(/[\n\r]+|(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function titleize(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 6)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeTags(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .slice(0, 3);
}

export function buildMockFeatures(input: {
  documentTitle: string;
  extractedText: string | null;
}) {
  const baseText = input.extractedText?.trim();

  if (!baseText) {
    return [
      {
        title: `${input.documentTitle} intake summary`,
        description:
          "This document was stored successfully, but there was not enough parsed text to generate detailed feature candidates yet.",
        module: "Intake",
        confidenceScore: 42,
        tags: ["document", "review"],
        excerpt: input.documentTitle,
      },
    ] satisfies ExtractedFeatureCandidate[];
  }

  const sentences = toSentences(baseText).slice(0, 4);

  if (sentences.length === 0) {
    return [
      {
        title: `${input.documentTitle} review item`,
        description: "Parsed text was available but did not produce sentence-level candidates.",
        module: "Review",
        confidenceScore: 38,
        tags: ["review"],
        excerpt: baseText.slice(0, 180),
      },
    ] satisfies ExtractedFeatureCandidate[];
  }

  return sentences.map((sentence, index) => {
    const cleanedSentence = sentence.replace(/\s+/g, " ").trim();
    const titleSource = cleanedSentence.replace(/^[^a-zA-Z0-9]+/, "");
    const fallbackTitle = `${input.documentTitle} candidate ${index + 1}`;
    const title =
      titleSource.length >= 8 ? titleize(titleSource) : fallbackTitle;
    const firstWord = cleanedSentence.split(/\s+/)[0] ?? "General";
    const moduleName =
      titleize(firstWord.replace(/[^a-zA-Z0-9-]/g, "")) || "General";

    return {
      title,
      description: cleanedSentence,
      module: moduleName,
      confidenceScore: Math.max(52, 80 - index * 7),
      tags: Array.from(new Set(["mock", ...normalizeTags(cleanedSentence)])).slice(0, 4),
      excerpt: cleanedSentence.slice(0, 240),
    };
  }) satisfies ExtractedFeatureCandidate[];
}
