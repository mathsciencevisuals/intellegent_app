import { buildDuplicateCandidateMap } from "@/lib/features/duplicate-candidates";

type ReportFeature = {
  id: string;
  title: string;
  module: string | null;
  status: "CANDIDATE" | "APPROVED" | "MERGED" | "REJECTED";
  confidenceScore: number;
  sources: Array<{
    source: {
      id: string;
      name: string;
    } | null;
    document: {
      id: string;
      title: string;
    };
  }>;
};

type ReportSource = {
  id: string;
  name: string;
  type: string;
  documents: Array<{ id: string }>;
};

export function buildWorkspaceReports(input: {
  features: ReportFeature[];
  sources: ReportSource[];
}) {
  const duplicateMap = buildDuplicateCandidateMap(
    input.features.map((feature) => ({
      id: feature.id,
      title: feature.title,
      status: feature.status,
      confidenceScore: feature.confidenceScore,
    }))
  );

  const duplicateRows = input.features
    .map((feature) => {
      const candidates = duplicateMap.get(feature.id) ?? [];
      const topCandidate = candidates[0];

      if (!topCandidate) {
        return null;
      }

      const target = input.features.find((item) => item.id === topCandidate.candidateId);

      if (!target) {
        return null;
      }

      return {
        featureId: feature.id,
        featureTitle: feature.title,
        candidateId: target.id,
        candidateTitle: target.title,
        score: Math.round(topCandidate.score * 100),
        module: feature.module || "General",
      };
    })
    .filter(
      (
        row
      ): row is {
        featureId: string;
        featureTitle: string;
        candidateId: string;
        candidateTitle: string;
        score: number;
        module: string;
      } => Boolean(row)
    )
    .sort((left, right) => right.score - left.score);

  const statusDistribution = ["CANDIDATE", "APPROVED", "REJECTED", "MERGED"].map(
    (status) => ({
      status,
      count: input.features.filter((feature) => feature.status === status).length,
    })
  );

  const sourceCoverage = input.sources
    .map((source) => {
      const linkedFeatures = input.features.filter((feature) =>
        feature.sources.some((item) => item.source?.id === source.id)
      );

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        documentCount: source.documents.length,
        featureCount: linkedFeatures.length,
        approvedCount: linkedFeatures.filter((feature) => feature.status === "APPROVED")
          .length,
      };
    })
    .sort((left, right) => right.featureCount - left.featureCount);

  const moduleDistribution = Array.from(
    input.features.reduce((map, feature) => {
      const key = feature.module || "General";
      const current = map.get(key) ?? {
        module: key,
        total: 0,
        approved: 0,
        rejected: 0,
      };

      current.total += 1;

      if (feature.status === "APPROVED") {
        current.approved += 1;
      }

      if (feature.status === "REJECTED") {
        current.rejected += 1;
      }

      map.set(key, current);
      return map;
    }, new Map<string, { module: string; total: number; approved: number; rejected: number }>())
  )
    .map((entry) => entry[1])
    .sort((left, right) => right.total - left.total);

  return {
    duplicateRows,
    statusDistribution,
    sourceCoverage,
    moduleDistribution,
  };
}
