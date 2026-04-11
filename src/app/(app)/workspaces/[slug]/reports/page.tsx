import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BarChart3, FileOutput, FolderTree, Layers3, ScanSearch, TrendingUp } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildWorkspaceReports } from "@/lib/reports/workspace-reports";
import {
  getSingleSearchParam,
  getWorkspaceReportData,
} from "@/lib/reports/workspace-report-query";
import { getPipelineVersion } from "@/lib/trust";
import { TrustCallout } from "@/components/ui/trust-callout";
import { WorkspaceTabHeaderActions } from "@/components/workspaces/workspace-tab-header-actions";
import { WorkspaceTabMoreMenu } from "@/components/workspaces/workspace-tab-more-menu";
import { SavedViewsPanel } from "@/components/workspaces/saved-views-panel";
import { parseSavedViewFilters } from "@/lib/saved-views";
import { formatUtcDateTime } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    job?: string | string[];
    status?: string | string[];
    module?: string | string[];
    sourceId?: string | string[];
  }>;
};

const SEVERITY_CONFIG = {
  high: { label: "High", cls: "border-red-200 bg-red-50 text-red-700" },
  medium: { label: "Medium", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  low: { label: "Low", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

const MATURITY_CONFIG: Record<string, { label: string; bar: string; bg: string }> = {
  "Non-Agentic": { label: "Non-Agentic", bar: "bg-red-400", bg: "bg-red-50" },
  Partial: { label: "Partial", bar: "bg-amber-400", bg: "bg-amber-50" },
  "Already Agentic": { label: "Already Agentic", bar: "bg-emerald-500", bg: "bg-emerald-50" },
};

function MaturityBar({ label, value, total }: { label: string; value: number; total: number }) {
  const config = MATURITY_CONFIG[label] ?? { label, bar: "bg-neutral-400", bg: "bg-neutral-50" };
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`rounded-2xl border p-4 ${config.bg}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-neutral-900">{config.label}</span>
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/60">
        <div className={`h-2 rounded-full ${config.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-neutral-500">{pct}% of total</div>
    </div>
  );
}

export async function WorkspaceReportsView({
  slug,
  userId,
  job,
  status,
  module,
  sourceId,
}: {
  slug: string;
  userId: string;
  job?: string | string[];
  status?: string | string[];
  module?: string | string[];
  sourceId?: string | string[];
}) {
  const selectedJobId = getSingleSearchParam(job)?.trim();
  const normalizedStatus = getSingleSearchParam(status);
  const moduleName = getSingleSearchParam(module)?.trim();
  const normalizedSourceId = getSingleSearchParam(sourceId)?.trim();
  const reportData = await getWorkspaceReportData({
    slug,
    userId,
    filters: {
      job: selectedJobId,
      status: normalizedStatus,
      module: moduleName,
      sourceId: normalizedSourceId,
    },
  });

  if (!reportData) {
    notFound();
  }

  const { workspace, filteredFeatures, filteredSources } = reportData;
  const reports = buildWorkspaceReports({
    features: filteredFeatures,
    sources: filteredSources,
  });

  const extractionJobs = await prisma.extractionJob.findMany({
    where: {
      workspaceId: workspace.id,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      featureCount: true,
      providerUsed: true,
      modelUsed: true,
      promptVersionUsed: true,
      temperatureUsed: true,
      maxTokensUsed: true,
      document: {
        select: {
          id: true,
          title: true,
        },
      },
      dashboardSnapshot: true,
      roadmapRecommendations: {
        orderBy: {
          priority: "desc",
        },
        take: 6,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const selectedRun =
    (selectedJobId
      ? extractionJobs.find((item) => item.id === selectedJobId) ?? null
      : null) ??
    extractionJobs.find((item) => item.status === "COMPLETED" && item.dashboardSnapshot) ??
    extractionJobs.find((item) => item.status === "COMPLETED") ??
    extractionJobs[0] ??
    null;
  const snapshot = selectedRun?.dashboardSnapshot ?? null;

  const savedViews = await prisma.savedView.findMany({
    where: { workspaceId: workspace.id, userId, scope: "REPORTS" },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const moduleOptions = Array.from(
    new Set(
      workspace.features
        .map((feature) => feature.module)
        .filter((v): v is string => Boolean(v))
    )
  ).sort((a, b) => a.localeCompare(b));

  const currentFilters = parseSavedViewFilters("REPORTS", {
    job: selectedJobId,
    status: normalizedStatus,
    module: moduleName,
    sourceId: normalizedSourceId,
  });

  const maturityTotal =
    (snapshot?.donutChartJson as Array<{ value: number }> | null)?.reduce(
      (sum, row) => sum + row.value,
      0
    ) || 1;

  return (
    <div className="space-y-6">
      <WorkspaceTabHeaderActions>
        <WorkspaceTabMoreMenu>
          <div className="space-y-6">
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Report filters</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Scope report outputs to a specific analysis run or workspace slice.
                </p>
              </div>
              <form className="grid gap-3">
                <select
                  name="job"
                  defaultValue={selectedJobId || ""}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">Latest completed analysis run</option>
                  {extractionJobs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.document.title} • {formatUtcDateTime(item.createdAt)}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue={normalizedStatus || ""}
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
                  defaultValue={normalizedSourceId || ""}
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
                  {moduleOptions.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
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
            </section>

            <section className="space-y-3 border-t border-neutral-200 pt-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Saved views</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Save and reopen report filter combinations, including the selected run.
                </p>
              </div>
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
            </section>
          </div>
        </WorkspaceTabMoreMenu>
      </WorkspaceTabHeaderActions>

      <TrustCallout
        title="Reports are generated from selected analysis runs"
        body="Use this tab to inspect exported summaries and planning outputs from a chosen run. The dashboard remains global; workspace reports stay anchored to run history and evidence-backed feature slices."
        points={[
          selectedRun ? `${selectedRun.document.title}` : "No selected run",
          `${filteredFeatures.length} scoped feature${filteredFeatures.length === 1 ? "" : "s"}`,
          `Pipeline ${getPipelineVersion()}`,
        ]}
        tone="warning"
      />

      {selectedRun ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-neutral-500">Selected run</div>
            <div className="mt-2 text-lg font-semibold text-neutral-900">
              {selectedRun.document.title}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-neutral-500">Run status</div>
            <div className="mt-2 text-lg font-semibold text-neutral-900">{selectedRun.status}</div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-neutral-500">Generated features</div>
            <div className="mt-2 text-3xl font-semibold text-neutral-900">
              {selectedRun.featureCount}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-neutral-500">Created</div>
            <div className="mt-2 text-lg font-semibold text-neutral-900">
              {formatUtcDateTime(selectedRun.createdAt)}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm md:col-span-2 xl:col-span-4">
            <div className="text-sm text-neutral-500">Model used</div>
            <div className="mt-2 text-lg font-semibold text-neutral-900">
              {selectedRun.modelUsed || "Not recorded"}
            </div>
            <div className="mt-2 text-sm text-neutral-500">
              {selectedRun.providerUsed || "Unknown provider"}
              {selectedRun.promptVersionUsed ? ` • ${selectedRun.promptVersionUsed}` : ""}
              {typeof selectedRun.temperatureUsed === "number"
                ? ` • temp ${selectedRun.temperatureUsed}`
                : ""}
              {typeof selectedRun.maxTokensUsed === "number"
                ? ` • ${selectedRun.maxTokensUsed} tokens`
                : ""}
            </div>
          </div>
        </div>
      ) : null}

      {snapshot ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(snapshot.kpiJson as Array<{ label: string; value: string; helper: string }>).map(
              (item) => (
                <div key={item.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {item.label}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-neutral-900">{item.value}</div>
                  <div className="mt-2 text-xs leading-5 text-neutral-500">{item.helper}</div>
                </div>
              )
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-neutral-400" />
                  <h2 className="font-semibold text-neutral-900">Module breakdown</h2>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {(
                  snapshot.moduleBreakdownJson as Array<{
                    module: string;
                    featureCount: number;
                    weeklyHoursWasted: number;
                    opportunityScore: number;
                    narrative: string;
                  }>
                ).map((row) => (
                  <div key={row.module} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-neutral-900">{row.module}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {row.featureCount} features • {row.weeklyHoursWasted}h/week at risk
                        </div>
                      </div>
                      <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
                        Score {row.opportunityScore}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-neutral-600">{row.narrative}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-neutral-400" />
                  <h2 className="font-semibold text-neutral-900">Maturity mix</h2>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {(snapshot.donutChartJson as Array<{ label: string; value: number }>).map((row) => (
                  <MaturityBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    total={maturityTotal}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-neutral-400" />
                  <h2 className="font-semibold text-neutral-900">Top opportunities</h2>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {(
                  snapshot.topOpportunitiesJson as Array<{
                    capability: string;
                    module: string;
                    score: number;
                    annualDollarImpact: number;
                    rationale: string;
                  }>
                ).map((row) => (
                  <div key={`${row.capability}-${row.module}`} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900">{row.capability}</div>
                        <div className="mt-0.5 text-xs text-neutral-500">{row.module}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700">
                          Score {row.score}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          ${row.annualDollarImpact.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-neutral-600">{row.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-white shadow-sm">
                <div className="border-b px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ScanSearch className="h-5 w-5 text-neutral-400" />
                    <h2 className="font-semibold text-neutral-900">Risk register</h2>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  {(
                    snapshot.riskRegisterJson as Array<{
                      title: string;
                      severity: string;
                      mitigation: string;
                    }>
                  ).map((row) => {
                    const sev =
                      SEVERITY_CONFIG[row.severity.toLowerCase() as keyof typeof SEVERITY_CONFIG] ??
                      SEVERITY_CONFIG.low;
                    return (
                      <div key={row.title} className="rounded-2xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold text-neutral-900">{row.title}</div>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sev.cls}`}
                          >
                            {sev.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-neutral-600">{row.mitigation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRun.roadmapRecommendations.length > 0 ? (
                <div className="rounded-2xl border bg-white shadow-sm">
                  <div className="border-b px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileOutput className="h-5 w-5 text-neutral-400" />
                      <h2 className="font-semibold text-neutral-900">Generated report outputs</h2>
                    </div>
                  </div>
                  <div className="space-y-3 p-5">
                    {selectedRun.roadmapRecommendations.map((row) => (
                      <div key={row.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-neutral-900">{row.title}</div>
                            <div className="mt-1 text-xs text-neutral-500">
                              Phase {row.phase} • Priority {row.priority}
                            </div>
                          </div>
                          {row.quickWin ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Quick win
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">{row.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-sm text-neutral-500">
          No dashboard snapshot is stored for the selected run yet. Choose a completed analysis run or rerun the document from the Analyses tab.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Duplicate candidates", value: reports.duplicateRows.length },
          {
            label: "Approved features",
            value:
              reports.statusDistribution.find((r) => r.status === "APPROVED")?.count ?? 0,
          },
          {
            label: "Sources with coverage",
            value: reports.sourceCoverage.filter((r) => r.featureCount > 0).length,
          },
          { label: "Modules represented", value: reports.moduleDistribution.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {label}
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-neutral-400" />
              <h2 className="font-semibold text-neutral-900">Duplicate effort report</h2>
            </div>
          </div>
          <div className="p-5">
            {reports.duplicateRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">
                No duplicate candidates detected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.duplicateRows.slice(0, 10).map((row) => (
                  <div key={`${row.featureId}-${row.candidateId}`} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900">{row.featureTitle}</div>
                        <div className="mt-0.5 text-xs text-neutral-500">
                          Possible duplicate: {row.candidateTitle}
                        </div>
                        <div className="mt-0.5 text-[11px] text-neutral-400">
                          Module: {row.module}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700">
                        {row.score}% match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-neutral-400" />
              <h2 className="font-semibold text-neutral-900">Feature status distribution</h2>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {reports.statusDistribution.map((row) => {
              const total = filteredFeatures.length || 1;
              const pct = Math.round((row.count / total) * 100);
              const barColor =
                row.status === "APPROVED"
                  ? "bg-emerald-500"
                  : row.status === "REJECTED"
                    ? "bg-red-400"
                    : row.status === "MERGED"
                      ? "bg-blue-500"
                      : "bg-neutral-400";
              return (
                <div key={row.status} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-neutral-900">
                      {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                    </span>
                    <span className="text-xl font-bold text-neutral-900">{row.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{pct}% of features</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-neutral-400" />
              <h2 className="font-semibold text-neutral-900">Source coverage</h2>
            </div>
          </div>
          <div className="p-5">
            {reports.sourceCoverage.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">
                No sources connected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.sourceCoverage.map((row) => (
                  <div key={row.sourceId} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900">{row.sourceName}</div>
                        <div className="mt-0.5 text-xs text-neutral-500 uppercase tracking-wide">
                          {row.sourceType}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-neutral-600">
                        <div>{row.documentCount} documents</div>
                        <div>{row.featureCount} features</div>
                        <div className="font-semibold text-emerald-700">{row.approvedCount} approved</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-neutral-400" />
              <h2 className="font-semibold text-neutral-900">Module distribution</h2>
            </div>
          </div>
          <div className="p-5">
            {reports.moduleDistribution.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">
                No module data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.moduleDistribution.map((row) => {
                  const approvedPct =
                    row.total > 0 ? Math.round((row.approved / row.total) * 100) : 0;
                  return (
                    <div key={row.module} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="font-semibold text-neutral-900">{row.module}</div>
                        <div className="text-right text-xs text-neutral-500">
                          <span className="font-semibold text-neutral-900">{row.total}</span> total
                          &nbsp;•&nbsp;
                          <span className="font-semibold text-emerald-700">{row.approved}</span> approved
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${approvedPct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        {approvedPct}% approved
                        {row.rejected > 0 && <span className="text-red-400"> • {row.rejected} rejected</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedRun ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspaces/${workspace.slug}?tab=analyses&job=${selectedRun.id}`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Open run history
          </Link>
          <Link
            href={`/workspaces/${workspace.slug}?tab=features&job=${selectedRun.id}`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Open run features
          </Link>
          <Link
            href={`/workspaces/${workspace.slug}?tab=documents`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Open documents
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default async function WorkspaceReportsPage({ params, searchParams }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams();
  query.set("tab", "reports");

  for (const key of ["job", "status", "module", "sourceId"] as const) {
    const value = resolvedSearchParams[key];
    if (typeof value === "string" && value.length > 0) {
      query.set(key, value);
    }
  }

  return redirect(`/workspaces/${slug}?${query.toString()}`);
}
