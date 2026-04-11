import type { ReactNode } from "react";

import { formatUtcDateTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type OverviewMetric = {
  label: string;
  value: number;
  helper: string;
};

type OverviewOpportunity = {
  id: string;
  title: string;
  module: string;
  maturity: string;
  recommendation: string;
  priorityScore: number;
  scores: {
    roiPotential: number;
  };
  impact: {
    weeklyHoursSaved: number;
    annualDollarValue: number;
  };
};

type OverviewDocument = {
  id: string;
  title: string;
  status: string;
  createdAt: Date | string;
};

type OverviewJob = {
  id: string;
  status: string;
  trigger: string;
  featureCount: number;
  confidenceAvg: number | null;
  createdAt: Date | string;
  completedAt: Date | string | null;
  document: {
    title: string;
  };
};

type OverviewPipeline = {
  name: string;
  featureCount: number;
  gapCount: number;
  hoursAtRisk: number;
  opportunityScore: number;
  narrative: string;
};

type OverviewSource = {
  id: string;
  name: string;
  type: string;
  status: string;
  syncFrequency: string;
  lastSyncedAt: Date | string | null;
};

type WorkspaceOverviewProps = {
  metrics: OverviewMetric[];
  executiveSummary: string[];
  opportunities: OverviewOpportunity[];
  documents: OverviewDocument[];
  jobs: OverviewJob[];
  pipelines: OverviewPipeline[];
  sources: OverviewSource[];
};

type EmptyStateProps = {
  message: string;
};

type TableProps = {
  title: string;
  description: string;
  headers: string[];
  emptyMessage: string;
  children: ReactNode;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value}%`;
}

function OverviewEmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
      {message}
    </div>
  );
}

function OverviewTable({
  title,
  description,
  headers,
  emptyMessage,
  children,
}: TableProps) {
  const rows = Array.isArray(children) ? children : [children];
  const hasRows = rows.some(Boolean);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasRows ? (
          <OverviewEmptyState message={emptyMessage} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">{children}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkspaceOverview({
  metrics,
  executiveSummary,
  opportunities,
  documents,
  jobs,
  pipelines,
  sources,
}: WorkspaceOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-neutral-500">{metric.label}</div>
            <div className="mt-2 text-3xl font-semibold text-neutral-900">{metric.value}</div>
            <div className="mt-2 text-sm text-neutral-500">{metric.helper}</div>
          </div>
        ))}
      </div>

      <OverviewTable
        title="Top opportunities by ROI"
        description="Highest-value automation targets from the latest workspace analysis."
        headers={["Opportunity", "Module", "ROI", "Annual value", "Hours/week", "Priority", "Maturity"]}
        emptyMessage="No ROI-ranked opportunities available yet."
      >
        {opportunities.map((opportunity) => (
          <tr key={opportunity.id} className="align-top">
            <td className="px-4 py-4">
              <div className="font-medium text-neutral-900">{opportunity.title}</div>
              <div className="mt-1 max-w-xl text-xs text-neutral-600">
                {opportunity.recommendation || "No recommendation captured yet."}
              </div>
            </td>
            <td className="px-4 py-4 text-neutral-700">{opportunity.module}</td>
            <td className="px-4 py-4 font-medium text-neutral-900">
              {opportunity.scores.roiPotential}
            </td>
            <td className="px-4 py-4 text-neutral-700">
              {formatCurrency(opportunity.impact.annualDollarValue)}
            </td>
            <td className="px-4 py-4 text-neutral-700">{opportunity.impact.weeklyHoursSaved}</td>
            <td className="px-4 py-4 text-neutral-700">{opportunity.priorityScore}</td>
            <td className="px-4 py-4">
              <StatusBadge status={opportunity.maturity} />
            </td>
          </tr>
        ))}
      </OverviewTable>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Executive summary</CardTitle>
          <CardDescription>
            Summary of the latest agentic intelligence signals across this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm leading-6 text-neutral-700">
            {executiveSummary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <OverviewTable
          title="Documents"
          description="Most recent workspace documents."
          headers={["Document", "Status", "Created"]}
          emptyMessage="No documents uploaded yet."
        >
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="px-4 py-4 font-medium text-neutral-900">{document.title}</td>
              <td className="px-4 py-4">
                <StatusBadge status={document.status} />
              </td>
              <td className="px-4 py-4 text-neutral-700">
                {formatUtcDateTime(document.createdAt)}
              </td>
            </tr>
          ))}
        </OverviewTable>

        <OverviewTable
          title="Jobs"
          description="Recent extraction and analysis runs."
          headers={["Document", "Status", "Trigger", "Features", "Confidence", "Started", "Completed"]}
          emptyMessage="No extraction jobs have been recorded yet."
        >
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-4 font-medium text-neutral-900">{job.document.title}</td>
              <td className="px-4 py-4">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-4 py-4 text-neutral-700">{job.trigger}</td>
              <td className="px-4 py-4 text-neutral-700">{job.featureCount}</td>
              <td className="px-4 py-4 text-neutral-700">{formatPercent(job.confidenceAvg)}</td>
              <td className="px-4 py-4 text-neutral-700">{formatUtcDateTime(job.createdAt)}</td>
              <td className="px-4 py-4 text-neutral-700">
                {job.completedAt ? formatUtcDateTime(job.completedAt) : "—"}
              </td>
            </tr>
          ))}
        </OverviewTable>

        <OverviewTable
          title="Pipelines"
          description="Top workflow modules from the latest persisted pipeline run."
          headers={["Module", "Signals", "Opportunities", "Hours/week", "Score", "Narrative"]}
          emptyMessage="No pipeline summaries are available yet."
        >
          {pipelines.map((pipeline) => (
            <tr key={pipeline.name}>
              <td className="px-4 py-4 font-medium text-neutral-900">{pipeline.name}</td>
              <td className="px-4 py-4 text-neutral-700">{pipeline.featureCount}</td>
              <td className="px-4 py-4 text-neutral-700">{pipeline.gapCount}</td>
              <td className="px-4 py-4 text-neutral-700">{pipeline.hoursAtRisk}</td>
              <td className="px-4 py-4 text-neutral-700">{pipeline.opportunityScore}</td>
              <td className="px-4 py-4 text-neutral-600">{pipeline.narrative}</td>
            </tr>
          ))}
        </OverviewTable>

        <OverviewTable
          title="Sources"
          description="Connected systems and their latest sync posture."
          headers={["Source", "Type", "Status", "Frequency", "Last synced"]}
          emptyMessage="No sources connected yet."
        >
          {sources.map((source) => (
            <tr key={source.id}>
              <td className="px-4 py-4 font-medium text-neutral-900">{source.name}</td>
              <td className="px-4 py-4 text-neutral-700">{source.type}</td>
              <td className="px-4 py-4">
                <StatusBadge status={source.status} />
              </td>
              <td className="px-4 py-4 text-neutral-700">{source.syncFrequency}</td>
              <td className="px-4 py-4 text-neutral-700">
                {source.lastSyncedAt ? formatUtcDateTime(source.lastSyncedAt) : "—"}
              </td>
            </tr>
          ))}
        </OverviewTable>
      </div>
    </div>
  );
}
