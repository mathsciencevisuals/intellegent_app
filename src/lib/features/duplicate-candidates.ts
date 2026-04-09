type FeatureLike = {
  id: string;
  title: string;
  status: "CANDIDATE" | "APPROVED" | "MERGED" | "REJECTED";
  confidenceScore: number;
};

export type DuplicateCandidate = {
  featureId: string;
  candidateId: string;
  score: number;
};

function normalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3);
}

function jaccardScore(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((word) => rightSet.has(word)).length;
  const union = new Set([...leftSet, ...rightSet]).size;

  return union === 0 ? 0 : intersection / union;
}

function prefixBoost(leftTitle: string, rightTitle: string) {
  const left = leftTitle.toLowerCase().trim();
  const right = rightTitle.toLowerCase().trim();

  if (left === right) return 1;
  if (left.startsWith(right) || right.startsWith(left)) return 0.92;
  return 0;
}

function computeScore(left: FeatureLike, right: FeatureLike) {
  const boostedPrefix = prefixBoost(left.title, right.title);

  if (boostedPrefix > 0) {
    return boostedPrefix;
  }

  const leftWords = normalizeWords(left.title);
  const rightWords = normalizeWords(right.title);
  const titleScore = jaccardScore(leftWords, rightWords);

  const confidenceAdjustment =
    Math.min(left.confidenceScore, right.confidenceScore) >= 70 ? 0.04 : 0;

  return Math.min(0.99, titleScore + confidenceAdjustment);
}

export function buildDuplicateCandidateMap(features: FeatureLike[]) {
  const candidateMap = new Map<string, DuplicateCandidate[]>();

  for (const feature of features) {
    candidateMap.set(feature.id, []);
  }

  for (let index = 0; index < features.length; index += 1) {
    const left = features[index];

    for (let nextIndex = index + 1; nextIndex < features.length; nextIndex += 1) {
      const right = features[nextIndex];

      if (left.status === "MERGED" || right.status === "MERGED") {
        continue;
      }

      const score = computeScore(left, right);

      if (score < 0.45) {
        continue;
      }

      candidateMap.get(left.id)?.push({
        featureId: left.id,
        candidateId: right.id,
        score,
      });
      candidateMap.get(right.id)?.push({
        featureId: right.id,
        candidateId: left.id,
        score,
      });
    }
  }

  for (const [featureId, candidates] of candidateMap.entries()) {
    candidateMap.set(
      featureId,
      candidates.sort((left, right) => right.score - left.score).slice(0, 5)
    );
  }

  return candidateMap;
}
