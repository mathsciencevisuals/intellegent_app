import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  BarChart3,
  FolderTree,
  Layers3,
  ScanSearch,
  SlidersHorizontal,
} from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLatestWorkspaceAnalytics } from "@/lib/features/workspace-analytics";
import { buildWorkspaceReports } from "@/lib/reports/workspace-reports";
import {
  getSingleSearchParam,
  getWorkspaceReportData,
} from "@/lib/reports/workspace-report-query";
import { buildSavedViewHref, parseSavedViewFilters } from "@/lib/saved-views";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedViewsPanel } from "@/components/workspaces/saved-views-panel";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    status?: string | string[];
    module?: string | string[];
    sourceId?: string | string[];
  }>;
};

export default async function WorkspaceReportsPage({ params, searchParams }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const status = getSingleSearchParam(resolvedSearchParams.status);
  const moduleName = getSingleSearchParam(resolvedSearchParams.module)?.trim();
  const sourceId = getSingleSearchParam(resolvedSearchParams.sourceId)?.trim();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  const reportData = await getWorkspaceReportData({
    slug,
    userId: user.id,
    filters: {
      status,
      module: moduleName,
      sourceId,
    },
  });

  if (!reportData) {
    notFound();
  }

  const { workspace, filteredFeatures, filteredSources } = reportData;
  const analytics = await getLatestWorkspaceAnalytics(workspace.id);
  const snapshot = analytics?.dashboardSnapshot;

  const reports = buildWorkspaceReports({
    features: filteredFeatures,
    sources: filteredSources,
  });
  const savedViews = await prisma.savedView.findMany({
    where: {
      workspaceId: workspace.id,
      userId: user.id,
      scope: "REPORTS",
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  });
  const moduleOptions = Array.from(
    new Set(
      workspace.features
        .map((feature) => feature.module)
        .filter((value): value is string => Boolean(value))
    )
  ).sort((left, right) => left.localeCompare(right));
  const currentFilters = parseSavedViewFilters("REPORTS", {
    status,
    module: moduleName,
    sourceId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description={`Stored KPI, roadmap, and risk summaries for ${workspace.name}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workspaces/${workspace.slug}/features`}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              Open repository
            </Link>
            <Link
              href={buildSavedViewHref(
                `/api/workspaces/${workspace.slug}/reports/export`,
                currentFilters
              )}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              Export CSV
            </Link>
          </div>
        }
      />

      {snapshot ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.kpiJson.map((item) => (
              <div key={item.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm text-neutral-500">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold text-neutral-900">{item.value}</div>
                <div className="mt-2 text-sm text-neutral-500">{item.helper}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5" />
                  Module breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-neutral-600">
                  {snapshot.uiCopyJson.dashboardTab.moduleBreakdown}
                </div>
                <div className="space-y-3">
                  {snapshot.moduleBreakdownJson.map((row) => (
                    <div key={row.module} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-neutral-900">{row.module}</div>
                          <div className="mt-1 text-sm text-neutral-600">
                            {row.featureCount} features • {row.weeklyHoursWasted}h/week at risk
                          </div>
                        </div>
                        <div className="text-sm font-medium text-neutral-700">
                          Score {row.opportunityScore}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-600">{row.narrative}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Maturity mix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.donutChartJson.map((row) => (
                  <div key={row.label} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium text-neutral-900">{row.label}</div>
                      <div className="text-xl font-semibold text-neutral-900">{row.value}</div>
                    </div>
                    <div className="mt-2 text-sm text-neutral-500">{row.helper}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Top opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-neutral-600">
                  {snapshot.uiCopyJson.dashboardTab.opportunities}
                </div>
                <div className="space-y-3">
                  {snapshot.topOpportunitiesJson.map((row) => (
                    <div key={`${row.capability}-${row.module}`} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-neutral-900">{row.capability}</div>
                          <div className="mt-1 text-sm text-neutral-600">{row.module}</div>
                        </div>
                        <div className="text-right text-sm text-neutral-700">
                          <div>Score {row.score}</div>
                          <div>${row.annualDollarImpact.toLocaleString()}</div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-600">{row.rationale}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Risk register and quick wins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-neutral-600">
                  {snapshot.uiCopyJson.dashboardTab.riskRegister}
                </div>
                <div className="space-y-3">
                  {snapshot.riskRegisterJson.map((row) => (
                    <div key={row.title} className="rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-medium text-neutral-900">{row.title}</div>
                        <div className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                          {row.severity}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-600">{row.mitigation}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {snapshot.quickWinsJson.map((row) => (
                    <div key={row.title} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="font-medium text-emerald-900">{row.title}</div>
                      <p className="mt-2 text-sm leading-6 text-emerald-800">{row.summary}</p>
                      <div className="mt-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-700">
                        Break-even in {row.breakEvenMonths} months
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Report filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[220px_220px_1fr_auto]">
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
              name="sourceId"
              defaultValue={sourceId || ""}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All sources</option>
              {workspace.sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            <select
              name="module"
              defaultValue={moduleName || ""}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All modules</option>
              {moduleOptions.map((moduleOption) => (
                <option key={moduleOption} value={moduleOption}>
                  {moduleOption}
                </option>
              ))}
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
            scope="REPORTS"
            basePath={`/workspaces/${workspace.slug}/reports`}
            currentFilters={currentFilters}
            savedViews={savedViews.map((view) => ({
              id: view.id,
              name: view.name,
              filters: parseSavedViewFilters("REPORTS", view.filters),
              createdAt: view.createdAt,
            }))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Duplicate rows</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {reports.duplicateRows.length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Approved features</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {reports.statusDistribution.find((item) => item.status === "APPROVED")?.count ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Sources with coverage</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {reports.sourceCoverage.filter((item) => item.featureCount > 0).length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Modules represented</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {reports.moduleDistribution.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5" />
              Duplicate effort report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.duplicateRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                No duplicate candidates detected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.duplicateRows.slice(0, 10).map((row) => (
                  <div key={`${row.featureId}-${row.candidateId}`} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-neutral-900">{row.featureTitle}</div>
                        <div className="mt-1 text-sm text-neutral-600">
                          Possible duplicate: {row.candidateTitle}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          Module: {row.module}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-neutral-700">
                        {row.score}% match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feature status distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.statusDistribution.map((row) => (
                <div key={row.status} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium text-neutral-900">{row.status}</div>
                    <div className="text-xl font-semibold text-neutral-900">{row.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Source coverage report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.sourceCoverage.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                No sources connected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.sourceCoverage.map((row) => (
                  <div key={row.sourceId} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-neutral-900">{row.sourceName}</div>
                        <div className="mt-1 text-sm text-neutral-600">
                          Type: {row.sourceType}
                        </div>
                      </div>
                      <div className="text-right text-sm text-neutral-600">
                        <div>{row.documentCount} documents</div>
                        <div>{row.featureCount} features</div>
                        <div>{row.approvedCount} approved</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5" />
              Module distribution report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.moduleDistribution.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                No module data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.moduleDistribution.map((row) => (
                  <div key={row.module} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="font-medium text-neutral-900">{row.module}</div>
                      <div className="text-right text-sm text-neutral-600">
                        <div>{row.total} total</div>
                        <div>{row.approved} approved</div>
                        <div>{row.rejected} rejected</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
