import Link from "next/link";
import { Clock3 } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatUtcDateTime } from "@/lib/utils";

export type DashboardRecentAnalysis = {
  id: string;
  name: string;
  workspaceName: string;
  workspaceSlug: string;
  status: string;
  features: number;
  createdAt: string;
};

type RecentAnalysesListProps = {
  analyses: DashboardRecentAnalysis[];
  emptyMessage: string;
  compact?: boolean;
};

export function RecentAnalysesList({
  analyses,
  emptyMessage,
  compact = false,
}: RecentAnalysesListProps) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {analyses.map((analysis) => (
        <Link
          key={analysis.id}
          href={`/analyses?job=${analysis.id}`}
          className={`block rounded-2xl border bg-white transition hover:bg-neutral-50 ${
            compact ? "p-3" : "p-4"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-neutral-900">
                {analysis.name}
              </div>
              <div className="mt-1 text-sm text-neutral-500">{analysis.workspaceName}</div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatUtcDateTime(analysis.createdAt)}
                </span>
                <span>{analysis.features} features</span>
              </div>
            </div>

            <StatusBadge status={analysis.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
