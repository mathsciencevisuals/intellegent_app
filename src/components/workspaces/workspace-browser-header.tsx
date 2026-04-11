"use client";

import Link from "next/link";
import { Check, MoreHorizontal, Plus, Search } from "lucide-react";

import type { WorkspaceBrowserSortKey as SortKey } from "@/components/workspaces/workspace-browser-types";

type WorkspaceBrowserHeaderProps = {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  sortKey: SortKey;
  onSortChange: (value: SortKey) => void;
};

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  updatedAt: "Recently updated",
  createdAt: "Recently created",
};

export function WorkspaceBrowserHeader({
  menuOpen,
  onMenuToggle,
  onMenuClose,
  query,
  onQueryChange,
  sortKey,
  onSortChange,
}: WorkspaceBrowserHeaderProps) {
  return (
    <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Workspaces
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-400">
            Your workspaces
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/workspaces/new"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
            aria-label="Create workspace"
          >
            <Plus className="h-4 w-4" />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={onMenuToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
              aria-label="Workspace view options"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Sort workspaces
                </div>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSortChange(key);
                      onMenuClose();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100"
                  >
                    <span>{SORT_LABELS[key]}</span>
                    {sortKey === key ? <Check className="h-4 w-4" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search workspaces"
          className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          aria-label="Search workspaces"
        />
      </label>
    </div>
  );
}
