"use client";

import Link from "next/link";
import { useEffect, useState, useDeferredValue } from "react";
import { ActivitySquare, BriefcaseBusiness, Search } from "lucide-react";

import {
  RecentAnalysesList,
  type DashboardRecentAnalysis,
} from "@/components/dashboard/recent-analyses-list";
import { SectionContextPane } from "@/components/app/section-context-pane";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatUtcDateTime } from "@/lib/utils";

type DashboardRecentWorkspace = {
  id: string;
  name: string;
  slug: string;
  docs: number;
  analyses: number;
  status: string;
  updatedAt: string;
};

export type DashboardContextPaneProps = {
  recentWorkspaces: DashboardRecentWorkspace[];
  recentAnalyses: DashboardRecentAnalysis[];
};

type DashboardContextResponse = DashboardContextPaneProps;

export function DashboardContextPane() {
  const [data, setData] = useState<DashboardContextResponse>({
    recentWorkspaces: [],
    recentAnalyses: [],
  });
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard-context", {
          method: "GET",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard context.");
        }

        const payload = (await response.json()) as DashboardContextResponse;

        if (active) {
          setData(payload);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load dashboard context."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleWorkspaces = data.recentWorkspaces.filter((workspace) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      workspace.name.toLowerCase().includes(normalizedQuery) ||
      workspace.status.toLowerCase().includes(normalizedQuery)
    );
  });
  const visibleAnalyses = data.recentAnalyses.filter((analysis) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      analysis.name.toLowerCase().includes(normalizedQuery) ||
      analysis.workspaceName.toLowerCase().includes(normalizedQuery) ||
      analysis.status.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <SectionContextPane
      eyebrow="Dashboard context"
      title="Dashboard"
      description="Search recent items, reopen a workspace, or jump straight into a recent analysis run."
    >
      <div className="border-b border-neutral-200 bg-white px-5 py-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recent workspaces or analyses"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Loading dashboard context…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Recent workspaces
              </div>
              <div className="mt-3 space-y-2">
                {visibleWorkspaces.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-3 text-sm text-neutral-500">
                    {data.recentWorkspaces.length === 0
                      ? "No workspaces yet."
                      : `No workspaces match "${query}".`}
                  </div>
                ) : (
                  visibleWorkspaces.map((workspace) => (
                    <Link
                      key={workspace.id}
                      href={`/workspaces/${workspace.slug}`}
                      className="block rounded-xl border p-3 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-neutral-900">
                            {workspace.name}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            Updated {formatUtcDateTime(workspace.updatedAt)}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                            <span>{workspace.docs} docs</span>
                            <span>{workspace.analyses} analyses</span>
                          </div>
                        </div>
                        <StatusBadge status={workspace.status} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                <ActivitySquare className="h-3.5 w-3.5" />
                Recent analyses
              </div>
              <div className="mt-3">
                <RecentAnalysesList
                  analyses={visibleAnalyses}
                  compact
                  emptyMessage={
                    data.recentAnalyses.length === 0
                      ? "No completed or queued runs yet."
                      : `No analyses match "${query}".`
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionContextPane>
  );
}
