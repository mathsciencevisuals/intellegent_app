import Link from "next/link";
import { AlertTriangle, Bot, Sparkles, Timer, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IntelligenceSummaryPanelProps = {
  stats: {
    totalFeaturesAnalyzed: number;
    totalGapsIdentified: number;
    avgRoiScore: number;
    recoverableHoursPerWeek: number;
  };
};

export function IntelligenceSummaryPanel({
  stats,
}: IntelligenceSummaryPanelProps) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Bot className="h-4 w-4" />
            Agentic intelligence summary
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Cross-workspace summary of analyzed capabilities, automation gaps, and recoverable impact.
          </p>
        </div>
        <Link
          href="/repository"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Open repository
        </Link>
      </CardHeader>
      <CardContent>
        {stats.totalFeaturesAnalyzed === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
            Complete an analysis run to unlock the intelligence summary.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
                <Sparkles className="h-3.5 w-3.5" />
                Features analyzed
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.totalFeaturesAnalyzed}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Gaps identified
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {stats.totalGapsIdentified}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Avg ROI score
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.avgRoiScore}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
                <Timer className="h-3.5 w-3.5" />
                Hrs/week recoverable
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {stats.recoverableHoursPerWeek}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
