import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Filter, Search, Sparkles, Tags, X } from "lucide-react";

import { FeatureReviewForm } from "@/components/features/feature-review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrustCallout } from "@/components/ui/trust-callout";
import { WorkspaceTabHeaderActions } from "@/components/workspaces/workspace-tab-header-actions";
import { WorkspaceTabMoreMenu } from "@/components/workspaces/workspace-tab-more-menu";
import { authConfig } from "@/lib/auth";
import { buildDuplicateCandidateMap } from "@/lib/features/duplicate-candidates";
import { PIPELINE_CONFIG } from "@/lib/pipeline/constants";
import { prisma } from "@/lib/prisma";
import { getConfidenceClasses, getConfidenceLabel, getReviewGuidance } from "@/lib/trust";
import { formatUtcDateTime } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    job?: string | string[];
    feature?: string | string[];
  }>;
};

type MergeTargetOption = {
  id: string;
  title: string;
  status: "CANDIDATE" | "APPROVED" | "REJECTED";
};

export async function WorkspaceFeaturesView({
  slug,
  userId,
  job,
  feature,
}: {
  slug: string;
  userId: string;
  job?: string | string[];
  feature?: string | string[];
}) {
  const selectedJobId = Array.isArray(job) ? job[0] : job;
  const selectedFeatureId = Array.isArray(feature) ? feature[0] : feature;
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: { userId },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      extractionJobs: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          providerUsed: true,
          modelUsed: true,
          promptVersionUsed: true,
          temperatureUsed: true,
          maxTokensUsed: true,
          document: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const features = await prisma.feature.findMany({
    where: {
      workspaceId: workspace.id,
      ...(selectedJobId
        ? {
            capability: {
              is: {
                extractionJobId: selectedJobId,
              },
            },
          }
        : {}),
    },
    include: {
      capability: {
        select: {
          extractionJob: {
            select: {
              id: true,
              createdAt: true,
              document: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
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

  const selectedFeatureSummary = selectedFeatureId
    ? features.find((item) => item.id === selectedFeatureId) ?? null
    : null;

  const selectedFeature = selectedFeatureSummary
    ? await prisma.feature.findFirst({
        where: {
          id: selectedFeatureSummary.id,
          workspaceId: workspace.id,
        },
        include: {
          capability: {
            include: {
              extractionJob: {
                select: {
                  id: true,
                  createdAt: true,
                  document: {
                    select: {
                      title: true,
                    },
                  },
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
      })
    : null;

  const mergeTargets = selectedFeature
    ? await prisma.feature.findMany({
        where: {
          workspaceId: workspace.id,
          id: {
            not: selectedFeature.id,
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
      })
    : [];

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

  const relatedFeatures = selectedFeature
    ? await prisma.feature.findMany({
        where: {
          workspaceId: workspace.id,
          id: {
            not: selectedFeature.id,
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
      })
    : [];

  const duplicateCandidates = selectedFeature
    ? (buildDuplicateCandidateMap([
        {
          id: selectedFeature.id,
          title: selectedFeature.title,
          status: selectedFeature.status,
          confidenceScore: selectedFeature.confidenceScore,
        },
        ...relatedFeatures.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          confidenceScore: item.confidenceScore,
        })),
      ]).get(selectedFeature.id) ?? [])
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
        )
    : [];

  const confidenceLabel = selectedFeature
    ? getConfidenceLabel(selectedFeature.confidenceScore)
    : null;
  const confidenceGuidance = selectedFeature
    ? getReviewGuidance(selectedFeature.confidenceScore)
    : null;
  const modules = Array.from(
    new Set(features.map((item) => item.module).filter((value): value is string => Boolean(value)))
  ).sort((left, right) => left.localeCompare(right));
  const selectedRun =
    workspace.extractionJobs.find((item) => item.id === selectedJobId) ?? null;
  const buildFeaturesHref = (nextFeatureId?: string) => {
    const params = new URLSearchParams();

    if (selectedJobId) {
      params.set("job", selectedJobId);
    }

    if (nextFeatureId) {
      params.set("feature", nextFeatureId);
    }

    const query = params.toString();
    return query
      ? `/workspaces/${workspace.slug}?tab=features&${query}`
      : `/workspaces/${workspace.slug}?tab=features`;
  };

  return (
    <div className="space-y-6">
      <WorkspaceTabHeaderActions>
        <WorkspaceTabMoreMenu>
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Workspace features</h2>
              <p className="mt-1 text-xs text-neutral-500">
                This tab stays local to {workspace.name}. Use the global repository for
                cross-workspace review.
              </p>
            </div>
          </div>
        </WorkspaceTabMoreMenu>
      </WorkspaceTabHeaderActions>

      <TrustCallout
        title="Workspace feature review is local scope"
        body="This tab shows only features generated inside the selected workspace. Use it to review local candidates without mixing them with global repository decisions."
        points={[
          `${features.length} local feature${features.length === 1 ? "" : "s"}`,
          `${modules.length} module${modules.length === 1 ? "" : "s"} represented`,
          selectedRun ? `Scoped to ${selectedRun.document.title}` : "All analysis runs",
          `Pipeline ${PIPELINE_CONFIG.version}`,
        ]}
        tone="warning"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Local features</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{features.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Approved</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {features.filter((item) => item.status === "APPROVED").length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Needs review</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {features.filter((item) => item.status === "CANDIDATE").length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Filter className="h-4 w-4" />
              Workspace scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border p-4 text-sm text-neutral-600">
              Keep feature review local to the current workspace and optionally scope it to one analysis run.
            </div>

            <div className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Workspace
              </div>
              <div className="mt-2 font-semibold text-neutral-900">{workspace.name}</div>
            </div>

            <form className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Analysis run
              </div>
              <select
                name="job"
                defaultValue={selectedJobId ?? ""}
                className="mt-3 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">All analysis runs</option>
                {workspace.extractionJobs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.document.title} • {formatUtcDateTime(item.createdAt)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="mt-3 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
                Apply run filter
              </button>
            </form>

            {selectedRun ? (
              <div className="rounded-2xl border p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                  Runtime model
                </div>
                <div className="mt-2 font-semibold text-neutral-900">
                  {selectedRun.modelUsed || "Not recorded"}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {selectedRun.providerUsed || "Unknown provider"}
                  {selectedRun.promptVersionUsed
                    ? ` • ${selectedRun.promptVersionUsed}`
                    : ""}
                  {typeof selectedRun.temperatureUsed === "number"
                    ? ` • temp ${selectedRun.temperatureUsed}`
                    : ""}
                  {typeof selectedRun.maxTokensUsed === "number"
                    ? ` • ${selectedRun.maxTokensUsed} tokens`
                    : ""}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Modules found
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {modules.length === 0 ? (
                  <span className="text-sm text-neutral-500">No modules yet</span>
                ) : (
                  modules.map((module) => (
                    <span
                      key={module}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {module}
                    </span>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Search className="h-4 w-4" />
                Workspace feature table
              </CardTitle>
              {selectedFeature ? (
                <Link
                  href={`/workspaces/${workspace.slug}/features/${selectedFeature.id}${selectedJobId ? `?job=${encodeURIComponent(selectedJobId)}` : ""}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Full page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </CardHeader>
            <CardContent>
              {features.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-neutral-500">
                  No automation opportunities yet. Upload a document and run the pipeline to generate your first analysis.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-neutral-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Feature</th>
                        <th className="px-4 py-3 font-medium">Run</th>
                        <th className="px-4 py-3 font-medium">Module</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            selectedFeature?.id === item.id
                              ? "border-t bg-neutral-50"
                              : "border-t hover:bg-neutral-50"
                          }
                        >
                          <td className="px-4 py-3">
                            <Link href={buildFeaturesHref(item.id)} className="block">
                              <div className="font-medium text-neutral-900">{item.title}</div>
                              <div className="mt-1 text-xs text-neutral-500">
                                {item.description || "No description"}
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {item.capability?.extractionJob.document.title || "Unassigned"}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">{item.module || "—"}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3 text-neutral-600">{item.confidenceScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedFeature && confidenceLabel && confidenceGuidance ? (
        <>
          <Link
            href={buildFeaturesHref()}
            className="fixed inset-0 z-30 bg-neutral-950/35 backdrop-blur-[1px]"
            aria-label="Close feature drawer"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[520px] overflow-y-auto border-l border-neutral-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Workspace feature
                  </div>
                  <div className="mt-2 text-lg font-semibold text-neutral-900">
                    {selectedFeature.title}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {workspace.name}
                    {selectedFeature.module ? ` • ${selectedFeature.module}` : ""}
                  </div>
                </div>

                <Link
                  href={buildFeaturesHref()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <TrustCallout
                title="Selected feature is AI-assisted review input"
                body="Use workspace detail to validate evidence, adjust confidence, and confirm local status before promoting decisions into broader roadmap work."
                points={[
                  `${selectedFeature.confidenceScore}% ${confidenceLabel.toLowerCase()}`,
                  `${selectedFeature.sources.length} linked evidence source${selectedFeature.sources.length === 1 ? "" : "s"}`,
                  `Pipeline ${PIPELINE_CONFIG.version}`,
                ]}
                tone={selectedFeature.confidenceScore < 65 ? "warning" : "neutral"}
              />

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Selected feature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-neutral-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedFeature.status} />
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getConfidenceClasses(selectedFeature.confidenceScore)}`}
                    >
                      {selectedFeature.confidenceScore}% {confidenceLabel.toLowerCase()}
                    </span>
                  </div>

                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                      Reviewer guidance
                    </div>
                    <p className="mt-2 leading-6">{confidenceGuidance}</p>
                  </div>

                  <div className="rounded-2xl border bg-neutral-50 p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                      Analysis run
                    </div>
                    <p className="mt-2 leading-6">
                      {selectedFeature.capability?.extractionJob.document.title ||
                        "No analysis run is linked to this feature yet."}
                      {selectedFeature.capability?.extractionJob.createdAt
                        ? ` • ${formatUtcDateTime(selectedFeature.capability.extractionJob.createdAt)}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                      Description
                    </div>
                    <p className="mt-2 leading-6">
                      {selectedFeature.description || "No generated description is available yet."}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border p-4">
                      <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                        Evidence coverage
                      </div>
                      <div className="mt-2 font-semibold text-neutral-900">
                        {selectedFeature.sources.length} linked source
                        {selectedFeature.sources.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                        Audit trail
                      </div>
                      <div className="mt-2 text-sm text-neutral-700">
                        Created {formatUtcDateTime(selectedFeature.createdAt)} • Updated{" "}
                        {formatUtcDateTime(selectedFeature.updatedAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Review workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeatureReviewForm
                    slug={workspace.slug}
                    featureId={selectedFeature.id}
                    initialTitle={selectedFeature.title}
                    initialDescription={selectedFeature.description || ""}
                    initialConfidenceScore={selectedFeature.confidenceScore}
                    initialStatus={selectedFeature.status}
                    initialOwner={selectedFeature.owner || ""}
                    initialTags={selectedFeature.tags}
                    mergeTargets={normalizedMergeTargets}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Tags and duplicates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    {selectedFeature.tags.length === 0 ? (
                      <div className="text-sm text-neutral-500">No tags assigned.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedFeature.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                      Possible duplicates
                    </div>
                    {duplicateCandidates.length === 0 ? (
                      <div className="text-sm text-neutral-500">
                        No strong title-based duplicate candidates found yet.
                      </div>
                    ) : (
                      duplicateCandidates.slice(0, 3).map((candidate) => (
                        <Link
                          key={candidate.id}
                          href={buildFeaturesHref(candidate.id)}
                          className="block rounded-2xl border p-3 transition hover:bg-neutral-50"
                        >
                          <div className="font-medium text-neutral-900">{candidate.title}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {Math.round(candidate.score * 100)}% match
                            {candidate.module ? ` • ${candidate.module}` : ""}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

export default async function WorkspaceFeaturesPage({ params, searchParams }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  return redirect(
    `/workspaces/${slug}?tab=features${
      typeof resolvedSearchParams.job === "string"
        ? `&job=${encodeURIComponent(resolvedSearchParams.job)}`
        : ""
    }${
      typeof resolvedSearchParams.feature === "string"
        ? `&feature=${encodeURIComponent(resolvedSearchParams.feature)}`
        : ""
    }`
  );
}
