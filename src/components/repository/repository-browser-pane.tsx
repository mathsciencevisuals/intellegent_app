"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { SectionContextPane } from "@/components/app/section-context-pane";
import { StatusBadge } from "@/components/ui/status-badge";

type RepositoryFeatureSummary = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  confidenceScore: number;
  module: string | null;
  workspace: {
    name: string;
    slug: string;
  };
};

type RepositoryData = {
  features: RepositoryFeatureSummary[];
  workspaces: Array<{
    name: string;
    slug: string;
  }>;
  modules: string[];
};

const STATUS_OPTIONS = ["CANDIDATE", "APPROVED", "MERGED", "REJECTED"] as const;

export function RepositoryBrowserPane() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<RepositoryData>({
    features: [],
    workspaces: [],
    modules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const moduleName = searchParams.get("module") ?? "";
  const workspace = searchParams.get("workspace") ?? "";
  const selectedFeature = searchParams.get("feature") ?? "";
  const [searchValue, setSearchValue] = useState(q);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();

        if (q) {
          params.set("q", q);
        }
        if (status) {
          params.set("status", status);
        }
        if (moduleName) {
          params.set("module", moduleName);
        }
        if (workspace) {
          params.set("workspace", workspace);
        }

        const response = await fetch(
          `/api/repository${params.toString() ? `?${params.toString()}` : ""}`,
          {
            method: "GET",
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load repository browser.");
        }

        const payload = (await response.json()) as RepositoryData;

        if (active) {
          setData(payload);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load repository."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [moduleName, q, status, workspace]);

  const filterHref = useMemo(() => {
    return (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(overrides)) {
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      params.delete("feature");

      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    };
  }, [pathname, searchParams]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      filterHref({
        q: searchValue.trim() || undefined,
      })
    );
  }

  return (
    <SectionContextPane
      eyebrow="Repository filters"
      title="Feature Repository"
      description="Search and filter the global feature inventory here. The detail pane stays focused on the selected repository rows and review drawer."
    >
      <div className="border-b border-neutral-200 bg-white px-5 py-4">
        <form onSubmit={submitSearch} className="flex gap-2">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search features"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white"
          >
            Apply
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={filterHref({ status: undefined })}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status ? "border-neutral-200 text-neutral-500" : "border-neutral-900 bg-neutral-900 text-white"
            }`}
          >
            All statuses
          </Link>
          {STATUS_OPTIONS.map((option) => (
            <Link
              key={option}
              href={filterHref({ status: status === option ? undefined : option })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                status === option
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              {option}
            </Link>
          ))}
        </div>

        <div className="mt-3 grid gap-2">
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterHref({ workspace: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                workspace
                  ? "border-neutral-200 text-neutral-600"
                  : "border-neutral-900 bg-neutral-900 text-white"
              }`}
            >
              All workspaces
            </Link>
            {data.workspaces.map((item) => (
              <Link
                key={item.slug}
                href={filterHref({
                  workspace: workspace === item.slug ? undefined : item.slug,
                })}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  workspace === item.slug
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={filterHref({ module: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                moduleName
                  ? "border-neutral-200 text-neutral-600"
                  : "border-neutral-900 bg-neutral-900 text-white"
              }`}
            >
              All modules
            </Link>
            {data.modules.map((item) => (
              <Link
                key={item}
                href={filterHref({
                  module: moduleName === item ? undefined : item,
                })}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  moduleName === item
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Loading repository…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : data.features.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            No repository features match the current filters.
          </div>
        ) : (
          <div className="space-y-2">
            {data.features.map((feature) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("feature", feature.id);
              const active = selectedFeature === feature.id;

              return (
                <Link
                  key={feature.id}
                  href={`${pathname}?${params.toString()}`}
                  className={`block rounded-2xl border bg-white p-4 transition hover:bg-neutral-50 ${
                    active ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900">
                        {feature.title}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">
                        {feature.workspace.name}
                        {feature.module ? ` • ${feature.module}` : ""}
                      </div>
                      <div className="mt-2 text-xs text-neutral-500">
                        {feature.description || "No description"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={feature.status} />
                      <div className="mt-2 text-xs text-neutral-500">
                        {feature.confidenceScore}% confidence
                      </div>
                    </div>
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
