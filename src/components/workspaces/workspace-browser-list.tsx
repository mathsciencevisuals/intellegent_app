"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Plus, Search } from "lucide-react";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type Props = {
  activeSlug?: string;
  workspaces: WorkspaceItem[];
  density: "COMFORTABLE" | "COMPACT";
};

type SortDirection = "asc" | "desc";

export function WorkspaceBrowserList({ activeSlug, workspaces, density }: Props) {
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const rowPadding = density === "COMPACT" ? "px-3 py-2.5" : "px-4 py-3";

  const filteredWorkspaces = normalizedQuery
    ? workspaces.filter((workspace) => {
        const haystack = `${workspace.name} ${workspace.slug} ${workspace.role}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : workspaces;
  const sortedWorkspaces = [...filteredWorkspaces].sort((left, right) => {
    const comparison = left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });

    return sortDirection === "asc" ? comparison : -comparison;
  });

  function toggleSort() {
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  }

  return (
    <aside className="flex h-full min-h-screen w-full flex-col border-r bg-white">
      <div className="border-b px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Workspaces</h2>
            <p className="text-sm text-neutral-500">Browse and switch workspace context</p>
          </div>

          <Link
            href="/workspaces/new"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border text-neutral-700 transition hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-xl border bg-neutral-50 px-3 py-2">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workspaces"
            className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
            aria-label="Search workspaces"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 flex items-center justify-between gap-3 px-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Your workspaces
          </div>
          <div className="text-xs text-neutral-400">
            {filteredWorkspaces.length}/{workspaces.length}
          </div>
        </div>

        <div>
          {workspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No workspaces yet.
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No workspaces match <span className="font-medium">{query}</span>.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-neutral-50 text-left text-neutral-500">
                    <tr>
                      <th className={rowPadding + " font-medium"}>
                        <button
                          type="button"
                          onClick={toggleSort}
                          className="inline-flex items-center gap-1.5 hover:text-neutral-700"
                        >
                          Workspace
                          {sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </th>
                      <th className={rowPadding + " font-medium"}>Role</th>
                      <th className={rowPadding + " font-medium"}>Slug</th>
                      <th className={rowPadding + " font-medium text-right"}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedWorkspaces.map((workspace) => {
                      const isActive = workspace.slug === activeSlug;

                      return (
                        <tr
                          key={workspace.id}
                          className={`border-t transition ${
                            isActive ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <td className={rowPadding}>
                            <Link
                              href={`/workspaces/${workspace.slug}`}
                              className="block min-w-0"
                            >
                              <div className="truncate font-medium">{workspace.name}</div>
                            </Link>
                          </td>
                          <td
                            className={`${rowPadding} ${
                              isActive ? "text-neutral-200" : "text-neutral-600"
                            }`}
                          >
                            {workspace.role}
                          </td>
                          <td
                            className={`${rowPadding} ${
                              isActive ? "text-neutral-300" : "text-neutral-500"
                            }`}
                          >
                            <Link
                              href={`/workspaces/${workspace.slug}`}
                              className="block truncate"
                            >
                              {workspace.slug}
                            </Link>
                          </td>
                          <td className={rowPadding + " text-right"}>
                            <Link
                              href={`/workspaces/${workspace.slug}`}
                              className={`inline-flex items-center gap-1 font-medium ${
                                isActive
                                  ? "text-white hover:text-neutral-200"
                                  : "text-neutral-700 hover:text-neutral-900"
                              }`}
                            >
                              Open
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
