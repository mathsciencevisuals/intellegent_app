import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ActivitySquare, ArrowRight, FileText, RotateCcw } from "lucide-react";

import type { AnalysisResult } from "@/lib/analysis-service";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUtcDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrustCallout } from "@/components/ui/trust-callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunExtractionJobButton } from "@/components/workspaces/run-extraction-job-button";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    job?: string | string[];
  }>;
};

function getGapCount(job: {
  capabilities: Array<{ id: string }>;
  document: { analysisResult: unknown };
}) {
  if (job.capabilities.length > 0) {
    return job.capabilities.length;
  }

  const analysisResult = job.document.analysisResult as AnalysisResult | null;
  return analysisResult?.features.filter((feature) => feature.gap.trim().length > 0).length ?? 0;
}

function getMaturityPercent(job: {
  dashboardSnapshot: { donutChartJson: unknown } | null;
  document: { analysisResult: unknown };
}) {
  if (job.dashboardSnapshot) {
    const rows = Array.isArray(job.dashboardSnapshot.donutChartJson)
      ? (job.dashboardSnapshot.donutChartJson as Array<{ label?: string; value?: number }>)
      : [];
    const total = rows.reduce((sum, row) => sum + (typeof row.value === "number" ? row.value : 0), 0);
    const agentic = rows.reduce((sum, row) => {
      if (typeof row.value !== "number") {
        return sum;
      }

      return row.label === "Already Agentic" ? sum + row.value : sum;
    }, 0);

    return total > 0 ? Math.round((agentic / total) * 100) : 0;
  }

  const analysisResult = job.document.analysisResult as AnalysisResult | null;
  const scores: number[] =
    analysisResult?.features.map((feature) => {
      if (feature.status === "agentic") {
        return 100;
      }

      if (feature.status === "partial") {
        return 50;
      }

      return 0;
    }) ?? [];

  if (scores.length === 0) {
    return 0;
  }

  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

export async function WorkspacePipelineView({
  slug,
  userId,
}: {
  slug: string;
  userId: string;
  job?: string | string[];
}) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      extractionJobs: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          trigger: true,
          provider: true,
          providerUsed: true,
          modelUsed: true,
          promptVersionUsed: true,
          temperatureUsed: true,
          maxTokensUsed: true,
          featureCount: true,
          confidenceAvg: true,
          createdAt: true,
          completedAt: true,
          document: {
            select: {
              id: true,
              title: true,
              analysisResult: true,
              source: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          capabilities: {
            select: {
              id: true,
            },
          },
          dashboardSnapshot: {
            select: {
              donutChartJson: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const completedRuns = workspace.extractionJobs.filter((item) => item.status === "COMPLETED");
  const runningRuns = workspace.extractionJobs.filter(
    (item) => item.status === "QUEUED" || item.status === "PROCESSING"
  );
  const totalFeatures = workspace.extractionJobs.reduce((sum, item) => sum + item.featureCount, 0);
  const averageMaturity =
    completedRuns.length > 0
      ? Math.round(
          completedRuns.reduce((sum, item) => sum + getMaturityPercent(item), 0) /
            completedRuns.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Analyses"
        description={`Analysis is tracked as run history for ${workspace.name}. Read results in Documents, Features, and Reports.`}
      />

      <TrustCallout
        title="Analysis runs store history, not a separate reading surface"
        body="Use this tab to monitor run status, compare runs, and rerun source documents. Consume ingest context in Documents and Sources, extracted outputs in Features, and summarized outputs in Reports."
        points={[
          `${workspace.extractionJobs.length} total run${workspace.extractionJobs.length === 1 ? "" : "s"}`,
          `${completedRuns.length} completed`,
          `${runningRuns.length} active`,
        ]}
        tone="warning"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Runs</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.extractionJobs.length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Completed</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{completedRuns.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Features generated</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{totalFeatures}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Avg maturity</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{averageMaturity}%</div>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ActivitySquare className="h-5 w-5" />
            Analysis runs
          </CardTitle>
          <div className="text-sm text-neutral-500">
            Results move into workspace tabs after each run completes.
          </div>
        </CardHeader>
        <CardContent>
          {workspace.extractionJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
              No analysis runs yet. Upload a document in Documents or connect a source to create the first run.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Run</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Source document</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Model used</th>
                    <th className="px-4 py-3 font-medium">Features</th>
                    <th className="px-4 py-3 font-medium">Gaps</th>
                    <th className="px-4 py-3 font-medium">Maturity</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.extractionJobs.map((item) => {
                    const gapCount = getGapCount(item);
                    const maturityPercent = getMaturityPercent(item);
                    const documentsHref = `/workspaces/${workspace.slug}?tab=documents`;
                    const featuresHref = `/workspaces/${workspace.slug}?tab=features&job=${item.id}`;
                    const reportsHref = `/workspaces/${workspace.slug}?tab=reports&job=${item.id}`;

                    return (
                      <tr key={item.id} className="border-t align-top hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{item.document.title}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {item.trigger} run
                            {item.providerUsed
                              ? ` • ${item.providerUsed}`
                              : item.provider
                                ? ` • ${item.provider}`
                                : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          <div>{item.document.title}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {item.document.source?.name || "Manual upload"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {formatUtcDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {item.modelUsed ? (
                            <div>
                              <div className="font-medium text-neutral-900">{item.modelUsed}</div>
                              <div className="mt-1 text-xs text-neutral-500">
                                {item.promptVersionUsed || "No prompt version"}
                                {typeof item.temperatureUsed === "number"
                                  ? ` • temp ${item.temperatureUsed}`
                                  : ""}
                                {typeof item.maxTokensUsed === "number"
                                  ? ` • ${item.maxTokensUsed} tokens`
                                  : ""}
                              </div>
                            </div>
                          ) : (
                            "Not recorded"
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{item.featureCount}</td>
                        <td className="px-4 py-3 text-neutral-600">{gapCount}</td>
                        <td className="px-4 py-3 text-neutral-600">{maturityPercent}%</td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-[220px] flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              <RunExtractionJobButton
                                slug={workspace.slug}
                                documentId={item.document.id}
                                label={
                                  item.status === "FAILED" ? "Retry" : item.status === "COMPLETED" ? "Rerun" : "Run again"
                                }
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                              />
                              <Link
                                href={featuresHref}
                                className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                              >
                                Features
                              </Link>
                              <Link
                                href={reportsHref}
                                className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                              >
                                Reports
                              </Link>
                            </div>
                            <Link
                              href={documentsHref}
                              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                            >
                              Open document context
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Run responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-600">
            <div className="rounded-2xl border p-4">
              Ingest belongs in <span className="font-medium text-neutral-900">Documents</span>,{" "}
              <span className="font-medium text-neutral-900">Sources</span>, and upload flow.
            </div>
            <div className="rounded-2xl border p-4">
              Extracted outputs belong in <span className="font-medium text-neutral-900">Features</span>.
            </div>
            <div className="rounded-2xl border p-4">
              Summarized and exportable outputs belong in{" "}
              <span className="font-medium text-neutral-900">Reports</span>.
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Canonical reading flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-600">
            <div className="rounded-2xl border p-4">
              Start in Documents to verify parse and upload context.
            </div>
            <div className="rounded-2xl border p-4">
              Move to Features to review extracted opportunities scoped to a run.
            </div>
            <div className="rounded-2xl border p-4">
              Finish in Reports to inspect summary outputs for a selected run.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function WorkspacePipelinePage({ params, searchParams }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  return redirect(
    `/workspaces/${slug}?tab=analyses${
      typeof resolvedSearchParams.job === "string"
        ? `&job=${encodeURIComponent(resolvedSearchParams.job)}`
        : ""
    }`
  );
}
