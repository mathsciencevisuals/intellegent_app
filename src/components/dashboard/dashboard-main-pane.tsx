import { ActivitySquare } from "lucide-react";

import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import {
  RecentAnalysesList,
  type DashboardRecentAnalysis,
} from "@/components/dashboard/recent-analyses-list";
import {
  TopOpportunitiesPanel,
  type DashboardOpportunity,
} from "@/components/dashboard/top-opportunities-panel";
import { IntelligenceSummaryPanel } from "@/components/dashboard/intelligence-summary-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export type DashboardMainPaneProps = {
  stats: {
    workspaceCount: number;
    documentCount: number;
    pendingInviteCount: number;
    processingJobs: number;
    approvedFeatures: number;
    totalFeaturesAnalyzed: number;
    totalGapsIdentified: number;
    avgRoiScore: number;
    recoverableHoursPerWeek: number;
  };
  recentAnalyses: DashboardRecentAnalysis[];
  topOpportunities: DashboardOpportunity[];
  executiveSummary: string[];
};

export function DashboardMainPane({
  stats,
  recentAnalyses,
  topOpportunities,
  executiveSummary,
}: DashboardMainPaneProps) {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Global intelligence overview"
        description="Pane 2 stays focused on recent workspace and analysis context. This surface only summarizes cross-workspace performance, analyses, and top repository opportunities."
      />

      <DashboardKpiRow stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ActivitySquare className="h-4 w-4" />
              Recent analyses
            </CardTitle>
            <p className="text-sm text-neutral-500">
              Latest runs across all workspaces, kept here as a dashboard summary instead of a workspace-local queue.
            </p>
          </CardHeader>
          <CardContent>
            <RecentAnalysesList
              analyses={recentAnalyses}
              emptyMessage="No completed or queued runs yet."
            />
          </CardContent>
        </Card>

        <IntelligenceSummaryPanel stats={stats} />
      </div>

      <TopOpportunitiesPanel
        opportunities={topOpportunities}
        executiveSummary={executiveSummary}
      />
    </div>
  );
}
