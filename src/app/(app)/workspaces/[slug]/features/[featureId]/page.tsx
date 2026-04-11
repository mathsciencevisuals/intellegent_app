import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, GitBranchPlus, Sparkles, Tags } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { PIPELINE_CONFIG } from "@/lib/pipeline/constants";
import { prisma } from "@/lib/prisma";
import { getConfidenceClasses, getConfidenceLabel, getReviewGuidance } from "@/lib/trust";
import { buildDuplicateCandidateMap } from "@/lib/features/duplicate-candidates";
import { formatUtcDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { FeatureReviewForm } from "@/components/features/feature-review-form";
import { TrustCallout } from "@/components/ui/trust-callout";

type Props = {
  params: Promise<{ slug: string; featureId: string }>;
};

type MergeTargetOption = {
  id: string;
  title: string;
  status: "CANDIDATE" | "APPROVED" | "REJECTED";
};

export default async function WorkspaceFeatureDetailPage({ params }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug, featureId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  const feature = await prisma.feature.findFirst({
    where: {
      id: featureId,
      workspaceId: workspace.id,
    },
    include: {
      capability: {
        include: {
          extractionJob: {
            select: {
              id: true,
              createdAt: true,
            },
          },
          assessment: true,
          roadmapRecommendations: {
            orderBy: {
              priority: "asc",
            },
          },
        },
      },
      sources: {
        include: {
          source: true,
          document: true,
        },
      },
      mergedInto: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      mergedFeatures: {
        select: {
          id: true,
          title: true,
          status: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!feature) {
    notFound();
  }

  const mergeTargets = await prisma.feature.findMany({
    where: {
      workspaceId: workspace.id,
      id: {
        not: feature.id,
      },
      status: {
        in: ["CANDIDATE", "APPROVED", "REJECTED"],
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
    orderBy: [
      {
        confidenceScore: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: 25,
  });

  const normalizedMergeTargets: MergeTargetOption[] = mergeTargets.map((item) => ({
    id: item.id,
    title: item.title,
    status:
      item.status === "REJECTED"
        ? "REJECTED"
        : item.status === "APPROVED"
          ? "APPROVED"
        : "CANDIDATE",
  }));

  const relatedFeatures = await prisma.feature.findMany({
    where: {
      workspaceId: workspace.id,
      id: {
        not: feature.id,
      },
      status: {
        not: "MERGED",
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      confidenceScore: true,
      module: true,
    },
    orderBy: [
      {
        confidenceScore: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: 50,
  });

  const duplicateMap = buildDuplicateCandidateMap([
    {
      id: feature.id,
      title: feature.title,
      status: feature.status,
      confidenceScore: feature.confidenceScore,
    },
    ...relatedFeatures.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      confidenceScore: item.confidenceScore,
    })),
  ]);

  const duplicateCandidates = (duplicateMap.get(feature.id) ?? [])
    .map((candidate) => {
      const match = relatedFeatures.find((item) => item.id === candidate.candidateId);

      if (!match) {
        return null;
      }

      return {
        ...match,
        score: candidate.score,
      };
    })
    .filter(
      (
        item
      ): item is {
        id: string;
        title: string;
        status: "CANDIDATE" | "APPROVED" | "REJECTED";
        confidenceScore: number;
        module: string | null;
        score: number;
      } => Boolean(item)
    );
  const confidenceLabel = getConfidenceLabel(feature.confidenceScore);
  const confidenceGuidance = getReviewGuidance(feature.confidenceScore);
  const sourceCount = feature.sources.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature"
        title={feature.title}
        description={`Traceability and review controls for a feature candidate in ${workspace.name}.`}
        actions={
          <Link
            href={`/workspaces/${workspace.slug}/features`}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to repository
            </span>
          </Link>
        }
      />

      <TrustCallout
        title="AI-assisted feature candidate"
        body="This record is generated from extracted evidence and heuristic scoring. Use it to accelerate review, not as an automated source of truth for delivery or compliance decisions."
        points={[
          `${feature.confidenceScore}% ${confidenceLabel.toLowerCase()}`,
          `${sourceCount} linked evidence source${sourceCount === 1 ? "" : "s"}`,
          `Pipeline ${PIPELINE_CONFIG.version}`,
        ]}
        tone={feature.confidenceScore < 65 ? "warning" : "neutral"}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Status</div>
          <div className="mt-3">
            <StatusBadge status={feature.status} />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Confidence</div>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getConfidenceClasses(feature.confidenceScore)}`}
            >
              {feature.confidenceScore}% {confidenceLabel.toLowerCase()}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Evidence coverage</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {sourceCount}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Linked document excerpts for reviewer validation
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Owner / agent</div>
          <div className="mt-2 text-lg font-semibold text-neutral-900">
            {feature.owner || feature.capability?.assessment?.agentTypeLabel || "Unassigned"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Reviewer guidance
                </div>
                <p className="mt-2 leading-6">{confidenceGuidance}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Module
                </div>
                <div className="mt-2 text-base font-medium text-neutral-900">
                  {feature.module || "General"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Description
                </div>
                <p className="mt-2 leading-6">
                  {feature.description || "No generated description is available yet."}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Audit trail
                </div>
                <div className="mt-2 text-neutral-700">
                  Created {formatUtcDateTime(feature.createdAt)} • Updated{" "}
                  {formatUtcDateTime(feature.updatedAt)}
                  {feature.capability?.extractionJob
                    ? ` • Derived from run ${formatUtcDateTime(feature.capability.extractionJob.createdAt)}`
                    : ""}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Reviewed at
                </div>
                <div className="mt-2 text-neutral-700">
                  {feature.reviewedAt
                    ? formatUtcDateTime(feature.reviewedAt)
                    : "Not reviewed yet"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Merged into
                </div>
                <div className="mt-2 text-neutral-700">
                  {feature.mergedInto ? (
                    <Link
                      href={`/workspaces/${workspace.slug}/features/${feature.mergedInto.id}`}
                      className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                    >
                      {feature.mergedInto.title}
                    </Link>
                  ) : (
                    "Not merged"
                  )}
                </div>
              </div>
              {feature.capability?.assessment ? (
                <>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                      Gap scores
                    </div>
                    <div className="mt-2 text-neutral-700">
                      Repeatability {feature.capability.assessment.repeatabilityScore} • ROI{" "}
                      {feature.capability.assessment.roiScore} • Data{" "}
                      {feature.capability.assessment.dataAvailabilityScore} • Risk{" "}
                      {feature.capability.assessment.riskScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                      Value conversion
                    </div>
                    <div className="mt-2 text-neutral-700">
                      {feature.capability.assessment.weeklyHoursWasted} hours/week •{" "}
                      {feature.capability.assessment.yearlyHoursWasted} hours/year • $
                      {feature.capability.assessment.annualDollarImpact.toLocaleString()} annual value
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                      Rationale
                    </div>
                    <p className="mt-2 leading-6">{feature.capability.assessment.rationale}</p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {feature.capability?.assessment ? (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Score guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                {Object.entries(feature.capability.assessment.scoreExplanations as Record<string, string>).map(
                  ([key, value]) => (
                    <div key={key} className="rounded-2xl border p-4">
                      <div className="font-medium capitalize text-neutral-900">{key}</div>
                      <p className="mt-2 leading-6">{value}</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranchPlus className="h-5 w-5" />
                Source traceability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feature.sources.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="font-medium text-neutral-900">
                      {item.source?.name || "Manual upload"}
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Document: {item.document.title}
                    </div>
                    <div className="mt-2 text-sm text-neutral-600">
                      {item.excerpt || "No excerpt recorded."}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Possible duplicates</CardTitle>
            </CardHeader>
            <CardContent>
              {duplicateCandidates.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  No strong title-based duplicate candidates found yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {duplicateCandidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/workspaces/${workspace.slug}/features/${candidate.id}`}
                            className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                          >
                            {candidate.title}
                          </Link>
                          <div className="mt-1 text-sm text-neutral-600">
                            Module: {candidate.module || "General"} • Confidence:{" "}
                            {candidate.confidenceScore}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-neutral-600">
                          {Math.round(candidate.score * 100)}% match
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Review workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <FeatureReviewForm
                slug={workspace.slug}
                featureId={feature.id}
                initialTitle={feature.title}
                initialDescription={feature.description || ""}
                initialConfidenceScore={feature.confidenceScore}
                initialStatus={feature.status}
                initialOwner={feature.owner || ""}
                initialTags={feature.tags}
                mergeTargets={normalizedMergeTargets}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feature.tags.length === 0 ? (
                <div className="text-sm text-neutral-500">No tags assigned.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {feature.capability?.roadmapRecommendations.length ? (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Roadmap recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                {feature.capability.roadmapRecommendations.slice(0, 1).map((recommendation) => (
                  <div key={recommendation.id} className="rounded-2xl border p-4">
                    <div className="font-medium text-neutral-900">{recommendation.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {recommendation.phase} • break-even in {recommendation.breakEvenMonths} months
                    </div>
                    <p className="mt-3 leading-6">{recommendation.summary}</p>
                    <p className="mt-3 leading-6 text-neutral-600">
                      {recommendation.implementationNotes}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Merged children</CardTitle>
            </CardHeader>
            <CardContent>
              {feature.mergedFeatures.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  No other features have been merged into this one.
                </div>
              ) : (
                <div className="space-y-2">
                  {feature.mergedFeatures.map((item) => (
                    <Link
                      key={item.id}
                      href={`/workspaces/${workspace.slug}/features/${item.id}`}
                      className="block rounded-xl border px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
