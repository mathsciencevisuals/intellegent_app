import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ActivitySquare,
  ArrowRight,
  BriefcaseBusiness,
  Library,
  Rocket,
} from "lucide-react";

import type { DashboardRecentAnalysis } from "@/components/dashboard/recent-analyses-list";
import type { DashboardOpportunity } from "@/components/dashboard/top-opportunities-panel";
import { DashboardMainPane } from "@/components/dashboard/dashboard-main-pane";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AppDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      memberships: {
        orderBy: {
          createdAt: "desc",
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
  const hasWorkspaces = user.memberships.length > 0;

  const [
    documentCount,
    pendingInviteCount,
    approvedFeatures,
    processingJobs,
    completedRunCount,
    recentRuns,
    topRoiCapabilities,
    agenticStats,
  ] = await Promise.all([
    workspaceIds.length
      ? prisma.document.count({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
          },
        })
      : Promise.resolve(0),
    prisma.workspaceInvite.count({
      where: {
        email: session.user.email.toLowerCase(),
        status: "PENDING",
      },
    }),
    workspaceIds.length
      ? prisma.feature.count({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
            status: "APPROVED",
          },
        })
      : Promise.resolve(0),
    workspaceIds.length
      ? prisma.extractionJob.count({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
            status: {
              in: ["QUEUED", "PROCESSING"],
            },
          },
        })
      : Promise.resolve(0),
    workspaceIds.length
      ? prisma.extractionJob.count({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
            status: "COMPLETED",
          },
        })
      : Promise.resolve(0),
    workspaceIds.length
      ? prisma.extractionJob.findMany({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
          },
          select: {
            id: true,
            status: true,
            featureCount: true,
            createdAt: true,
            workspace: {
              select: {
                name: true,
                slug: true,
              },
            },
            document: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 6,
        })
      : Promise.resolve([]),
    workspaceIds.length
      ? prisma.capability.findMany({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
            assessment: {
              isNot: null,
            },
          },
          include: {
            workspace: {
              select: {
                name: true,
                slug: true,
              },
            },
            assessment: true,
          },
          orderBy: [
            {
              assessment: {
                roiScore: "desc",
              },
            },
            {
              updatedAt: "desc",
            },
          ],
          take: 5,
        })
      : Promise.resolve([]),
    workspaceIds.length
      ? prisma.capabilityAssessment.findMany({
          where: {
            capability: {
              workspaceId: {
                in: workspaceIds,
              },
            },
          },
          select: {
            maturityTier: true,
            roiScore: true,
            weeklyHoursWasted: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const hasCompletedRun = completedRunCount > 0;

  if (!hasCompletedRun) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          eyebrow="Home"
          title="Guided setup"
          description="Create the first workspace, connect one source, and complete the first analysis before unlocking the full repository workflow."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/onboarding"
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <span className="inline-flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Start onboarding
                </span>
              </Link>
              <Link
                href="/workspaces/new"
                className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                {hasWorkspaces ? "Create another workspace" : "Create workspace"}
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Workspaces"
            value={user.memberships.length}
            description={hasWorkspaces ? "Workspaces created so far" : "Create your first workspace"}
            icon={<BriefcaseBusiness className="h-5 w-5" />}
          />
          <StatCard
            title="Analyses"
            value={0}
            description="Unlocked after the first run"
            icon={<ActivitySquare className="h-5 w-5" />}
          />
          <StatCard
            title="Repository items"
            value={0}
            description="Builds from completed runs"
            icon={<Library className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">First-value path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-5">
                  <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                    Step 1
                  </div>
                  <div className="mt-2 font-medium text-neutral-900">Create a workspace</div>
                  <div className="mt-2 text-sm text-neutral-500">
                    Start with the team, product area, or function you want to analyze.
                  </div>
                </div>
                <div className="rounded-2xl border p-5">
                  <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                    Step 2
                  </div>
                  <div className="mt-2 font-medium text-neutral-900">Connect a source</div>
                  <div className="mt-2 text-sm text-neutral-500">
                    Use manual upload or a connected system to establish the first intake path.
                  </div>
                </div>
                <div className="rounded-2xl border p-5">
                  <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                    Step 3
                  </div>
                  <div className="mt-2 font-medium text-neutral-900">Run the first analysis</div>
                  <div className="mt-2 text-sm text-neutral-500">
                    Completed runs unlock the analyses view and populate the feature repository.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">What changes after setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border p-4">
                <div className="font-medium text-neutral-900">Dashboard</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Switches from teaching mode to a summary of your most recent workspaces and opportunities.
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium text-neutral-900">Analyses</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Becomes the dedicated place for run history and analysis results.
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium text-neutral-900">Repository</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Expands into the full searchable table across all workspaces once features exist.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasWorkspaces ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Current workspaces</CardTitle>
              <Link
                href="/workspaces"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Open
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.memberships.slice(0, 8).map((membership) => (
                  <Link
                    key={membership.id}
                    href={`/workspaces/${membership.workspace.slug}`}
                    className="block rounded-2xl border p-4 transition hover:bg-neutral-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {membership.workspace.name}
                        </div>
                        <div className="mt-1 text-sm text-neutral-500">
                          {membership.role}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  const recentAnalyses: DashboardRecentAnalysis[] = recentRuns.map((run) => ({
    id: run.id,
    name: run.document.title,
    workspaceName: run.workspace.name,
    workspaceSlug: run.workspace.slug,
    status: run.status,
    features: run.featureCount,
    createdAt: run.createdAt.toISOString(),
  }));

  const topOpportunities: DashboardOpportunity[] = topRoiCapabilities
    .filter((capability) => capability.assessment)
    .map((capability) => ({
      id: capability.id,
      workspaceSlug: capability.workspace.slug,
      workspaceName: capability.workspace.name,
      title: capability.name,
      module: capability.module,
      roiScore: capability.assessment?.roiScore ?? 0,
      annualValue: capability.assessment?.annualDollarImpact ?? 0,
      weeklyHours: capability.assessment?.weeklyHoursWasted ?? 0,
      priorityScore: capability.assessment?.compositeOpportunityScore ?? 0,
      maturity: capability.assessment?.maturityTier ?? "NON_AGENTIC",
    }));

  const totalFeaturesAnalyzed = agenticStats.length;
  const topThreeTitles = topOpportunities.slice(0, 3).map((item) => item.title);
  const totalAnnualValue = topOpportunities.reduce((sum, item) => sum + item.annualValue, 0);
  const totalWeeklyHours = topOpportunities.reduce((sum, item) => sum + item.weeklyHours, 0);
  const agenticReadyCount = topOpportunities.filter((item) => item.maturity === "AGENTIC").length;
  const executiveSummary = topOpportunities.length
    ? [
        `The current cross-workspace backlog surfaces ${topOpportunities.length} high-ROI opportunities, representing ${totalWeeklyHours} recoverable hours per week and an estimated $${totalAnnualValue.toLocaleString("en-US")} in annual value.`,
        `Highest-return opportunities are ${topThreeTitles.join(", ")}${topThreeTitles.length > 0 ? "." : ""}`,
        `${agenticReadyCount} of these top opportunities are already agentic-ready, while the remainder still need workflow changes, controls, or data cleanup before rollout.`,
      ]
    : [
        "No ROI-ranked opportunities are available across your workspaces yet.",
        "Complete an analysis run to generate opportunity scoring and an executive summary.",
      ];

  return (
    <DashboardMainPane
      stats={{
        workspaceCount: user.memberships.length,
        documentCount,
        pendingInviteCount,
        processingJobs,
        approvedFeatures,
        totalFeaturesAnalyzed,
        totalGapsIdentified: agenticStats.filter((item) => item.maturityTier !== "AGENTIC").length,
        avgRoiScore:
          totalFeaturesAnalyzed > 0
            ? Math.round(
                agenticStats.reduce((sum, item) => sum + item.roiScore, 0) /
                  totalFeaturesAnalyzed
              )
            : 0,
        recoverableHoursPerWeek: agenticStats
          .filter((item) => item.maturityTier !== "AGENTIC")
          .reduce((sum, item) => sum + item.weeklyHoursWasted, 0),
      }}
      recentAnalyses={recentAnalyses}
      topOpportunities={topOpportunities}
      executiveSummary={executiveSummary}
    />
  );
}
