import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Search, Sparkles } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDuplicateCandidateMap } from "@/lib/features/duplicate-candidates";
import { getLatestWorkspaceAnalytics } from "@/lib/features/workspace-analytics";
import { parseSavedViewFilters } from "@/lib/saved-views";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { QuickMergeForm } from "@/components/features/quick-merge-form";
import { SavedViewsPanel } from "@/components/workspaces/saved-views-panel";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    duplicates?: string | string[];
  }>;
};

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WorkspaceFeaturesPage({
  params,
  searchParams,
}: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const q = getSingle(resolvedSearchParams.q)?.trim();
  const status = getSingle(resolvedSearchParams.status);
  const duplicates = getSingle(resolvedSearchParams.duplicates);

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

  const features = await prisma.feature.findMany({
    where: {
      workspaceId: workspace.id,
      ...(status &&
      (status === "CANDIDATE" ||
        status === "APPROVED" ||
        status === "MERGED" ||
        status === "REJECTED")
        ? { status }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      capability: {
        include: {
          assessment: true,
        },
      },
      sources: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
            },
          },
          source: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      mergedInto: {
        select: {
          id: true,
          title: true,
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
  });
  const analytics = await getLatestWorkspaceAnalytics(workspace.id);

  const duplicateMap = buildDuplicateCandidateMap(
    features.map((feature) => ({
      id: feature.id,
      title: feature.title,
      status: feature.status,
      confidenceScore: feature.confidenceScore,
    }))
  );

  const duplicateFilteredFeatures =
    duplicates === "only"
      ? features.filter((feature) => (duplicateMap.get(feature.id)?.length ?? 0) > 0)
      : features;
  const savedViews = await prisma.savedView.findMany({
    where: {
      workspaceId: workspace.id,
      userId: user.id,
      scope: "FEATURES",
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  });
  const currentFilters = parseSavedViewFilters("FEATURES", {
    q,
    status,
    duplicates,
  });
  const featuresUiCopy = analytics?.dashboardSnapshot?.uiCopyJson.featuresTab;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Features"
        description={`Search, review, and trace extracted feature candidates for ${workspace.name}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workspaces/${workspace.slug}/pipeline`}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              Open pipeline
            </Link>
            <Link
              href={`/workspaces/${workspace.slug}/reports`}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              Open reports
            </Link>
          </div>
        }
      />

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Repository filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_220px_180px_auto]">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search titles or descriptions"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue={status || ""}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="APPROVED">Approved</option>
              <option value="MERGED">Merged</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              name="duplicates"
              defaultValue={duplicates || ""}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All rows</option>
              <option value="only">Duplicate candidates only</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Saved views</CardTitle>
        </CardHeader>
        <CardContent>
          <SavedViewsPanel
            slug={workspace.slug}
            scope="FEATURES"
            basePath={`/workspaces/${workspace.slug}/features`}
            currentFilters={currentFilters}
            savedViews={savedViews.map((view) => ({
              id: view.id,
              name: view.name,
              filters: parseSavedViewFilters("FEATURES", view.filters),
              createdAt: view.createdAt,
            }))}
          />
        </CardContent>
      </Card>

      {featuresUiCopy ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-900">Score guide</div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {featuresUiCopy.scoreGuide}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-neutral-900">Impact guide</div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {featuresUiCopy.impactGuide}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Total features</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{features.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Approved</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {features.filter((feature) => feature.status === "APPROVED").length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Rejected</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {features.filter((feature) => feature.status === "REJECTED").length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">High confidence</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {features.filter((feature) => feature.confidenceScore >= 75).length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Duplicate candidates</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {
              features.filter((feature) => (duplicateMap.get(feature.id)?.length ?? 0) > 0)
                .length
            }
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Feature repository
          </CardTitle>
        </CardHeader>
        <CardContent>
          {duplicateFilteredFeatures.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-neutral-500">
              No feature candidates yet. Upload a document or run a pipeline job to generate the first set.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Feature</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Maturity</th>
                    <th className="px-4 py-3 font-medium">Impact</th>
                    <th className="px-4 py-3 font-medium">Module</th>
                    <th className="px-4 py-3 font-medium">Duplicates</th>
                    <th className="px-4 py-3 font-medium">Sources</th>
                    <th className="px-4 py-3 font-medium">Quick merge</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateFilteredFeatures.map((feature) => {
                    const duplicateCandidates = duplicateMap.get(feature.id) ?? [];
                    const quickMergeCandidates = duplicateCandidates
                      .map((candidate) => {
                        const target = features.find((item) => item.id === candidate.candidateId);

                        if (!target) {
                          return null;
                        }

                        return {
                          id: target.id,
                          title: target.title,
                          scoreLabel: `${Math.round(candidate.score * 100)}%`,
                        };
                      })
                      .filter((item): item is { id: string; title: string; scoreLabel: string } =>
                        Boolean(item)
                      );

                    return (
                    <tr key={feature.id} className="border-t align-top">
                      <td className="px-4 py-3">
                        <Link
                          href={`/workspaces/${workspace.slug}/features/${feature.id}`}
                          className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                        >
                          {feature.title}
                        </Link>
                        <div className="mt-1 text-xs text-neutral-500">
                          {feature.description?.slice(0, 120) || "No description"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={feature.status} />
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {feature.capability?.assessment
                          ? feature.capability.assessment.maturityTier.replace("_", " ")
                          : `${feature.confidenceScore}% confidence`}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {feature.capability?.assessment ? (
                          <div className="space-y-1 text-xs">
                            <div>{feature.capability.assessment.weeklyHoursWasted}h/week</div>
                            <div>
                              ${feature.capability.assessment.annualDollarImpact.toLocaleString()}
                            </div>
                            <div>
                              Score {feature.capability.assessment.compositeOpportunityScore}
                            </div>
                          </div>
                        ) : (
                          feature.confidenceScore
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        <div>{feature.module || "—"}</div>
                        {feature.capability?.assessment ? (
                          <div className="mt-1 text-xs text-neutral-400">
                            {feature.capability.assessment.agentTypeLabel}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {duplicateCandidates.length > 0 ? (
                          <div className="space-y-1">
                            {duplicateCandidates.slice(0, 2).map((candidate) => {
                              const target = features.find(
                                (item) => item.id === candidate.candidateId
                              );

                              if (!target) {
                                return null;
                              }

                              return (
                                <div key={candidate.candidateId} className="text-xs">
                                  <Link
                                    href={`/workspaces/${workspace.slug}/features/${target.id}`}
                                    className="underline-offset-4 hover:underline"
                                  >
                                    {target.title}
                                  </Link>{" "}
                                  <span className="text-neutral-400">
                                    {Math.round(candidate.score * 100)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {feature.status === "MERGED" && feature.mergedInto ? (
                          <Link
                            href={`/workspaces/${workspace.slug}/features/${feature.mergedInto.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            Merged into {feature.mergedInto.title}
                          </Link>
                        ) : (
                          feature.sources
                            .slice(0, 2)
                            .map((item) => item.source?.name || item.document.title)
                            .join(", ") || "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {feature.status === "MERGED" ? (
                          <span className="text-xs text-neutral-400">Merged</span>
                        ) : (
                          <QuickMergeForm
                            slug={workspace.slug}
                            featureId={feature.id}
                            candidates={quickMergeCandidates}
                          />
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
