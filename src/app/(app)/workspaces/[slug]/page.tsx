import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceOverview } from "@/components/workspaces/workspace-overview";
import { WorkspaceDocumentsView } from "@/components/workspaces/views/documents-view";
import { WorkspaceSourcesView } from "@/components/workspaces/views/sources-view";
import { WorkspacePipelineView } from "@/app/(app)/workspaces/[slug]/pipeline/page";
import { WorkspaceFeaturesView } from "@/app/(app)/workspaces/[slug]/features/page";
import { WorkspaceReportsView } from "@/app/(app)/workspaces/[slug]/reports/page";
import {
  listWorkspaceModuleSummaries,
  listWorkspaceOpportunities,
} from "@/lib/pipeline/opportunity-queries";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WorkspaceOverviewPage({ params, searchParams }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  const activeTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;

  if (activeTab === "sources") {
    return WorkspaceSourcesView({ slug, userId: user.id });
  }

  if (activeTab === "documents") {
    return WorkspaceDocumentsView({ slug, userId: user.id });
  }

  if (activeTab === "analyses") {
    return WorkspacePipelineView({ slug, userId: user.id, job: resolvedSearchParams.job });
  }

  if (activeTab === "features") {
    return WorkspaceFeaturesView({
      slug,
      userId: user.id,
      job: resolvedSearchParams.job,
      feature: resolvedSearchParams.feature,
    });
  }

  if (activeTab === "reports") {
    return WorkspaceReportsView({
      slug,
      userId: user.id,
      job: resolvedSearchParams.job,
      status: resolvedSearchParams.status,
      module: resolvedSearchParams.module,
      sourceId: resolvedSearchParams.sourceId,
    });
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
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      },
      features: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const [totalDocuments, totalSources, totalJobs] = await Promise.all([
    prisma.document.count({
      where: { workspaceId: workspace.id },
    }),
    prisma.source.count({
      where: { workspaceId: workspace.id },
    }),
    prisma.extractionJob.count({
      where: { workspaceId: workspace.id },
    }),
  ]);

  const [topOpportunities, pipelineModules, recentJobs, recentSources] = await Promise.all([
    listWorkspaceOpportunities({
      workspaceId: workspace.id,
      sort: "roi",
    }),
    listWorkspaceModuleSummaries(workspace.id),
    prisma.extractionJob.findMany({
      where: { workspaceId: workspace.id },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        status: true,
        trigger: true,
        featureCount: true,
        confidenceAvg: true,
        createdAt: true,
        completedAt: true,
        document: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.source.findMany({
      where: { workspaceId: workspace.id },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        syncFrequency: true,
        lastSyncedAt: true,
      },
    }),
  ]);

  const featureSummary = workspace.features.reduce(
    (summary, feature) => {
      summary.total += 1;

      if (feature.status === "APPROVED") {
        summary.approved += 1;
      }

      return summary;
    },
    { total: 0, approved: 0 }
  );

  const topOpportunitiesByRoi = topOpportunities.slice(0, 5);
  const topThreeTitles = topOpportunitiesByRoi.slice(0, 3).map((item) => item.title);
  const totalAnnualValue = topOpportunitiesByRoi.reduce(
    (sum, item) => sum + item.impact.annualDollarValue,
    0
  );
  const totalWeeklyHours = topOpportunitiesByRoi.reduce(
    (sum, item) => sum + item.impact.weeklyHoursSaved,
    0
  );
  const agenticReadyCount = topOpportunities.filter((item) => item.maturity === "AGENTIC").length;
  const executiveSummary = topOpportunitiesByRoi.length
    ? [
        `The latest pipeline run surfaced ${topOpportunities.length} scored opportunities across ${pipelineModules.length} workflow modules, with the top ROI candidates representing ${totalWeeklyHours} hours per week and an estimated $${totalAnnualValue.toLocaleString("en-US")} in annual value.`,
        `Highest-return opportunities are ${topThreeTitles.join(", ")}${topThreeTitles.length > 0 ? "." : ""}`,
        `${agenticReadyCount} opportunities are already agentic-ready, while the remaining backlog still needs partial automation, controls, or data cleanup before rollout.`,
      ]
    : [
        "No completed pipeline analytics are available for this workspace yet.",
        "Run an extraction job to generate ROI-ranked opportunities, module summaries, and agentic readiness metrics.",
      ];

  return (
    <WorkspaceOverview
      metrics={[
        {
          label: "Documents",
          value: totalDocuments,
          helper: "Uploaded into this workspace",
        },
        {
          label: "Sources",
          value: totalSources,
          helper: "Connected systems and manual channels",
        },
        {
          label: "Pipeline jobs",
          value: totalJobs,
          helper: "Historical extraction runs",
        },
        {
          label: "Approved features",
          value: featureSummary.approved,
          helper: `${featureSummary.total} total extracted candidates`,
        },
      ]}
      executiveSummary={executiveSummary}
      opportunities={topOpportunitiesByRoi}
      documents={workspace.documents}
      jobs={recentJobs}
      pipelines={pipelineModules.slice(0, 5)}
      sources={recentSources}
    />
  );
}
