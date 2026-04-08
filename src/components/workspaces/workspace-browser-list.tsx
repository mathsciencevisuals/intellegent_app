"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { BriefcaseBusiness, Plus, Search } from "lucide-react";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type Props = {
  activeSlug?: string;
  workspaces: WorkspaceItem[];
};

export function WorkspaceBrowserList({ activeSlug, workspaces }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredWorkspaces = normalizedQuery
    ? workspaces.filter((workspace) => {
        const haystack = `${workspace.name} ${workspace.slug} ${workspace.role}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : workspaces;

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

        <div className="space-y-2">
          {workspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No workspaces yet.
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No workspaces match <span className="font-medium">{query}</span>.
            </div>
          ) : (
            filteredWorkspaces.map((workspace) => {
              const isActive = workspace.slug === activeSlug;

              return (
                <Link
                  key={workspace.id}
                  href={`/workspaces/${workspace.slug}`}
                  className={`block rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "bg-white text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{workspace.name}</div>
                      <div
                        className={`mt-1 text-xs ${
                          isActive ? "text-neutral-300" : "text-neutral-500"
                        }`}
                      >
                        Role: {workspace.role}
                      </div>
                      <div
                        className={`mt-1 truncate text-xs ${
                          isActive ? "text-neutral-400" : "text-neutral-400"
                        }`}
                      >
                        {workspace.slug}
                      </div>
                    </div>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        isActive
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600"
                      }`}
                    >
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
