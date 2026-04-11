import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Library, Search, Sparkles, Tags, X } from "lucide-react";

import { FeatureStatus, Prisma } from "@/generated/prisma/client";
import { FeatureReviewForm } from "@/components/features/feature-review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrustCallout } from "@/components/ui/trust-callout";
import { authConfig } from "@/lib/auth";
import { buildDuplicateCandidateMap } from "@/lib/features/duplicate-candidates";
import { PIPELINE_CONFIG } from "@/lib/pipeline/constants";
import { prisma } from "@/lib/prisma";
import { getConfidenceClasses, getConfidenceLabel, getReviewGuidance } from "@/lib/trust";
import { formatUtcDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    feature?: string | string[];
    q?: string | string[];
    status?: string | string[];
    module?: string | string[];
    workspace?: string | string[];
  }>;
};

type MergeTargetOption = {
  id: string;
  title: string;
  status: "CANDIDATE" | "APPROVED" | "REJECTED";
};

type RepositoryFeatureListItem = Prisma.FeatureGetPayload<{
  include: {
    workspace: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
  };
}>;

function isFeatureStatus(value: string | undefined): value is FeatureStatus {
  return Object.values(FeatureStatus).includes(value as FeatureStatus);
}

export default async function RepositoryPage({ searchParams }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const selectedFeatureId = Array.isArray(resolvedSearchParams.feature)
    ? resolvedSearchParams.feature[0]
    : resolvedSearchParams.feature;
  const q = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;
  const status = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const moduleName = Array.isArray(resolvedSearchParams.module)
    ? resolvedSearchParams.module[0]
    : resolvedSearchParams.module;
  const workspaceSlug = Array.isArray(resolvedSearchParams.workspace)
    ? resolvedSearchParams.workspace[0]
    : resolvedSearchParams.workspace;
  const normalizedStatus = isFeatureStatus(status) ? status : undefined;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: {
      memberships: {
        orderBy: {
          workspace: {
            updatedAt: "desc",
          },
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const workspaceIds = user.memberships.map((membership) => membership.workspaceId);
  const featureWhere: Prisma.FeatureWhereInput = {
    workspaceId: {
      in: workspaceIds,
    },
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
    ...(moduleName ? { module: moduleName } : {}),
    ...(workspaceSlug ? { workspace: { slug: workspaceSlug } } : {}),
    ...(q
      ? {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [features, modules] = await Promise.all([
    workspaceIds.length
      ? prisma.feature.findMany({
          where: featureWhere,
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
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
          take: 40,
        })
      : Promise.resolve<RepositoryFeatureListItem[]>([]),
    workspaceIds.length
      ? prisma.feature.findMany({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
          },
          select: {
            module: true,
          },
          distinct: ["module"],
        })
      : Promise.resolve([]),
  ]);

  const selectedFeatureSummary = selectedFeatureId
    ? features.find((feature) => feature.id === selectedFeatureId) ?? null
    : null;

  const selectedFeature = selectedFeatureSummary
    ? await prisma.feature.findFirst({
        where: {
          id: selectedFeatureSummary.id,
          workspaceId: {
            in: workspaceIds,
          },
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
      })
    : null;

  const mergeTargets = selectedFeature
    ? await prisma.feature.findMany({
        where: {
          workspaceId: selectedFeature.workspaceId,
          id: {
            not: selectedFeature.id,
          },
          status: {
            in: [FeatureStatus.CANDIDATE, FeatureStatus.APPROVED, FeatureStatus.REJECTED],
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
          workspaceId: selectedFeature.workspaceId,
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
  const baseParams = new URLSearchParams();

  if (q) {
    baseParams.set("q", q);
  }
  if (status) {
    baseParams.set("status", status);
  }
  if (moduleName) {
    baseParams.set("module", moduleName);
  }
  if (workspaceSlug) {
    baseParams.set("workspace", workspaceSlug);
  }

  const repositoryHref = baseParams.toString()
    ? `/repository?${baseParams.toString()}`
    : "/repository";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Feature Repository"
        title="Global feature inventory"
        description="Use the selector pane to search and filter the global repository. This detail pane keeps the repository table and selected feature review surface together."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Repository rows</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{features.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Workspaces represented</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {new Set(features.map((feature) => feature.workspace.slug)).size}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Modules</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {modules.filter((item) => item.module).length}
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Search className="h-4 w-4" />
            Repository table
          </CardTitle>
          {selectedFeature ? (
            <Link
              href={`/workspaces/${selectedFeature.workspace.slug}/features/${selectedFeature.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Full page
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </CardHeader>
        <CardContent>
          {features.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <Library className="h-5 w-5 text-neutral-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                Repository is empty
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Run the first analysis in a workspace to generate features and populate the global repository.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Feature</th>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">Module</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => {
                    const params = new URLSearchParams();

                    if (q) {
                      params.set("q", q);
                    }
                    if (status) {
                      params.set("status", status);
                    }
                    if (moduleName) {
                      params.set("module", moduleName);
                    }
                    if (workspaceSlug) {
                      params.set("workspace", workspaceSlug);
                    }
                    params.set("feature", feature.id);

                    return (
                      <tr
                        key={feature.id}
                        className={
                          selectedFeature?.id === feature.id
                            ? "border-t bg-neutral-50"
                            : "border-t hover:bg-neutral-50"
                        }
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/repository?${params.toString()}`}
                            className="block"
                          >
                            <div className="font-medium text-neutral-900">{feature.title}</div>
                            <div className="mt-1 text-xs text-neutral-500">
                              {feature.description || "No description"}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{feature.workspace.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{feature.module || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={feature.status} />
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{feature.confidenceScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFeature && confidenceLabel && confidenceGuidance ? (
        <>
          <Link
            href={repositoryHref}
            className="fixed inset-0 z-30 bg-neutral-950/35 backdrop-blur-[1px]"
            aria-label="Close feature drawer"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[520px] overflow-y-auto border-l border-neutral-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Feature detail
                  </div>
                  <div className="mt-2 text-lg font-semibold text-neutral-900">
                    {selectedFeature.title}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {selectedFeature.workspace.name}
                    {selectedFeature.module ? ` • ${selectedFeature.module}` : ""}
                  </div>
                </div>

                <Link
                  href={repositoryHref}
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
                body="Use repository detail to compare evidence, adjust confidence, and confirm status. The repository is a decision-support surface, not automated truth."
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
                    slug={selectedFeature.workspace.slug}
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
                          href={`${repositoryHref}${repositoryHref.includes("?") ? "&" : "?"}feature=${candidate.id}`}
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
