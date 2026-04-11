import Link from "next/link";
import { ArrowRight, Library, ScrollText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export type DashboardOpportunity = {
  id: string;
  workspaceSlug: string;
  workspaceName: string;
  title: string;
  module: string;
  roiScore: number;
  annualValue: number;
  weeklyHours: number;
  priorityScore: number;
  maturity: string;
};

type TopOpportunitiesPanelProps = {
  opportunities: DashboardOpportunity[];
  executiveSummary: string[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function TopOpportunitiesPanel({
  opportunities,
  executiveSummary,
}: TopOpportunitiesPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Library className="h-4 w-4" />
              Top opportunities by ROI
            </CardTitle>
            <p className="text-sm text-neutral-500">
              Highest-return automation targets across your workspaces.
            </p>
          </div>
          <Link
            href="/repository"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Open repository
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
              Complete an analysis run to populate ROI-ranked opportunities.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Opportunity</th>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">ROI</th>
                    <th className="px-4 py-3 font-medium">Annual value</th>
                    <th className="px-4 py-3 font-medium">Hours/week</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Maturity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {opportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="align-top">
                      <td className="px-4 py-4">
                        <Link
                          href={`/workspaces/${opportunity.workspaceSlug}?tab=features`}
                          className="font-medium text-neutral-900 hover:text-neutral-600"
                        >
                          {opportunity.title}
                        </Link>
                        <div className="mt-1 text-xs text-neutral-500">{opportunity.module}</div>
                      </td>
                      <td className="px-4 py-4 text-neutral-700">{opportunity.workspaceName}</td>
                      <td className="px-4 py-4 font-medium text-neutral-900">
                        {opportunity.roiScore}
                      </td>
                      <td className="px-4 py-4 text-neutral-700">
                        {formatCurrency(opportunity.annualValue)}
                      </td>
                      <td className="px-4 py-4 text-neutral-700">{opportunity.weeklyHours}</td>
                      <td className="px-4 py-4 text-neutral-700">
                        {opportunity.priorityScore}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={opportunity.maturity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ScrollText className="h-4 w-4" />
            Executive summary
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Cross-workspace summary of the latest ROI and readiness signals.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm leading-6 text-neutral-700">
            {executiveSummary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
