"use client";

import Link from "next/link";
import { useEffect, useState, useDeferredValue } from "react";
import { Clock3, Search } from "lucide-react";

import { SectionContextPane } from "@/components/app/section-context-pane";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatUtcDateTime } from "@/lib/utils";

type AnalysisBrowserJob = {
  id: string;
  status: string;
  createdAt: string;
  featureCount: number;
  workspace: {
    name: string;
    slug: string;
  };
  document: {
    title: string;
  };
};

type ApiResponse = {
  jobs: AnalysisBrowserJob[];
};

function getRunCounts(jobs: AnalysisBrowserJob[]) {
  return {
    total: jobs.length,
    completed: jobs.filter((job) => job.status === "COMPLETED").length,
    running: jobs.filter((job) => job.status === "QUEUED" || job.status === "PROCESSING")
      .length,
  };
}

export function AnalysisBrowserPane() {
  const [jobs, setJobs] = useState<AnalysisBrowserJob[]>([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/analyses", {
          method: "GET",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Failed to load analysis runs.");
        }

        const payload = (await response.json()) as ApiResponse;

        if (active) {
          setJobs(payload.jobs);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load analysis runs."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      job.document.title.toLowerCase().includes(normalizedQuery) ||
      job.workspace.name.toLowerCase().includes(normalizedQuery)
    );
  });
  const counts = getRunCounts(jobs);

  return (
    <SectionContextPane
      eyebrow="Analysis browser"
      title="Analyses"
      description="Select a run here to jump into the workspace’s Analyses, Features, and Reports tabs."
    >
      <div className="border-b border-neutral-200 bg-white px-5 py-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search runs or workspaces"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
          <span>{counts.total} runs</span>
          <span>{counts.completed} completed</span>
          <span>{counts.running} running</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Loading analysis runs…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            {jobs.length === 0
              ? "No analysis runs yet."
              : `No analysis runs match "${query}".`}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleJobs.map((job) => {
              return (
                <Link
                  key={job.id}
                  href={`/workspaces/${job.workspace.slug}?tab=analyses&job=${job.id}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900">
                        {job.document.title}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">{job.workspace.name}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatUtcDateTime(job.createdAt)}
                        </span>
                        <span>{job.featureCount} features</span>
                      </div>
                    </div>

                    <StatusBadge status={job.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SectionContextPane>
  );
}
