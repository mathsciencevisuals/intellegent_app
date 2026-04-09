import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ActivitySquare, Bot, FileText, Layers3, Sparkles } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLatestWorkspaceAnalytics } from "@/lib/features/workspace-analytics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RunExtractionJobButton } from "@/components/workspaces/run-extraction-job-button";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function WorkspacePipelinePage({ params }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;

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
    include: {
      documents: {
        include: {
          source: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      extractionJobs: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const analytics = await getLatestWorkspaceAnalytics(workspace.id);
  const completedJobs = workspace.extractionJobs.filter(
    (job) => job.status === "COMPLETED"
  );
  const snapshot = analytics?.dashboardSnapshot;
  const latestJob = analytics?.latestJob;
  const kpis =
    snapshot?.kpiJson ?? [
      {
        label: "Jobs created",
        value: String(workspace.extractionJobs.length),
        helper: "Run the pipeline to generate stored analytics.",
      },
      {
        label: "Completed jobs",
        value: String(completedJobs.length),
        helper: "Completed runs will unlock capability assessments here.",
      },
      {
        label: "Features generated",
        value: String(completedJobs.reduce((sum, job) => sum + job.featureCount, 0)),
        helper: "Current pipeline output is still limited to raw extracted features.",
      },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Pipeline"
        description={`Run extraction, analysis, and dashboard snapshot generation for ${workspace.name}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workspaces/${workspace.slug}/features`}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              Open repository
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

      <div className={`grid gap-4 ${kpis.length >= 4 ? "xl:grid-cols-4 md:grid-cols-2" : "md:grid-cols-3"}`}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-neutral-500">{kpi.label}</div>
            <div className="mt-2 text-3xl font-semibold text-neutral-900">{kpi.value}</div>
            <div className="mt-2 text-sm text-neutral-500">{kpi.helper}</div>
          </div>
        ))}
      </div>

      {latestJob && snapshot ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5" />
                Latest ingest analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-neutral-50 p-4 text-sm text-neutral-600">
                Latest completed run: <span className="font-medium text-neutral-900">{latestJob.document.title}</span> on{" "}
                {new Date(latestJob.createdAt).toLocaleString()}.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Feature inventory
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-700">
                    {snapshot.uiCopyJson.ingestTab.featureInventory}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Maturity classification
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-700">
                    {snapshot.uiCopyJson.ingestTab.maturity}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Gap analysis
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-700">
                    {snapshot.uiCopyJson.ingestTab.gapAnalysis}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Roadmap outputs
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-700">
                    {snapshot.uiCopyJson.ingestTab.roadmap}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Capability cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestJob.capabilities.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                  No capability analytics are stored for this run yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {latestJob.capabilities.slice(0, 4).map((capability) => (
                    <div key={capability.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-neutral-900">{capability.name}</div>
                          <div className="mt-1 text-sm text-neutral-600">
                            Module: {capability.module} • {capability.currentMaturityTier.replace("_", " ")}
                          </div>
                        </div>
                        <div className="text-right text-sm text-neutral-600">
                          <div>{capability.extractedFeatureCount} extracted features</div>
                          <div>{capability.hiddenFeatureEstimate} hidden estimate</div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-700">
                        {capability.summaryNarrative}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Run extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workspace.documents.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                Upload a document first. Extraction jobs are created automatically on upload and can be rerun from here later.
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="font-medium text-neutral-900">{document.title}</div>
                        <div className="mt-1 text-sm text-neutral-600">
                          Source: {document.source?.name || "Manual upload"}
                        </div>
                        <div className="mt-1 text-sm text-neutral-600">
                          Parse status: {document.status}
                        </div>
                      </div>

                      <RunExtractionJobButton
                        slug={workspace.slug}
                        documentId={document.id}
                      />
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
              <ActivitySquare className="h-5 w-5" />
              Recent jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workspace.extractionJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                No extraction jobs yet.
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.extractionJobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {job.document.title}
                        </div>
                        <div className="mt-1 text-sm text-neutral-600">
                          Trigger: {job.trigger} • Provider: {job.provider || "—"}
                        </div>
                        <div className="mt-1 text-sm text-neutral-600">
                          Features: {job.featureCount}
                          {job.confidenceAvg ? ` • Avg confidence: ${job.confidenceAvg}` : ""}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          {job.logs || "No logs available."}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pipeline notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border p-4 text-sm text-neutral-600">
            The pipeline now persists three layers per completed run: extracted features, capability assessments with maturity and gap scores, and a dashboard snapshot with roadmap and risk summaries. The extraction heuristics are still mock logic, but the storage contract is now ready for a real queue-backed parser and analytics engine.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
