"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceBrowserHeader } from "@/components/workspaces/workspace-browser-header";
import { WorkspaceBrowserItem } from "@/components/workspaces/workspace-browser-item";
import type {
  WorkspaceBrowserItem as WorkspaceItem,
  WorkspaceBrowserSortKey as SortKey,
} from "@/components/workspaces/workspace-browser-types";

type Props = {
  workspaces: WorkspaceItem[];
};

export function WorkspaceBrowserList({ workspaces }: Props) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [menuOpen, setMenuOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const activeSlug = pathname?.startsWith("/workspaces/")
    ? pathname.split("/")[2]
    : undefined;

  const visibleWorkspaces = useMemo(() => {
    const filtered = workspaces.filter((workspace) =>
      normalizedQuery ? workspace.name.toLowerCase().includes(normalizedQuery) : true
    );

    return [...filtered].sort((left, right) => {
      if (sortKey === "createdAt") {
        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      }

      if (sortKey === "updatedAt") {
        return (
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      }

      return left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
    });
  }, [normalizedQuery, sortKey, workspaces]);

  const emptyMessage =
    workspaces.length === 0
      ? "No workspaces yet."
      : normalizedQuery
        ? `No workspaces match "${query}".`
        : "No workspaces available.";

  return (
    <aside className="flex h-full min-h-screen w-full flex-col border-r border-neutral-200 bg-neutral-50">
      <WorkspaceBrowserHeader
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onMenuClose={() => setMenuOpen(false)}
        query={query}
        onQueryChange={setQuery}
        sortKey={sortKey}
        onSortChange={setSortKey}
      />

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {visibleWorkspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-1">
            {visibleWorkspaces.map((workspace) => (
              <WorkspaceBrowserItem
                key={workspace.id}
                workspace={workspace}
                active={workspace.slug === activeSlug}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
