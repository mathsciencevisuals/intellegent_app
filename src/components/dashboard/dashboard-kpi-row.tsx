import {
  BriefcaseBusiness,
  Clock3,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";

type DashboardKpiRowProps = {
  stats: {
    workspaceCount: number;
    documentCount: number;
    pendingInviteCount: number;
    processingJobs: number;
    approvedFeatures: number;
  };
};

export function DashboardKpiRow({ stats }: DashboardKpiRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Workspaces"
        value={stats.workspaceCount}
        description="Active memberships"
        icon={<BriefcaseBusiness className="h-5 w-5" />}
      />
      <StatCard
        title="Documents"
        value={stats.documentCount}
        description="Across your workspaces"
        icon={<FileText className="h-5 w-5" />}
      />
      <StatCard
        title="Pending invites"
        value={stats.pendingInviteCount}
        description="Awaiting your action"
        icon={<Clock3 className="h-5 w-5" />}
      />
      <StatCard
        title="Processing jobs"
        value={stats.processingJobs}
        description="Runs still in flight"
        icon={<Loader2 className="h-5 w-5" />}
      />
      <StatCard
        title="Approved features"
        value={stats.approvedFeatures}
        description="Repository items approved"
        icon={<Sparkles className="h-5 w-5" />}
      />
    </div>
  );
}
