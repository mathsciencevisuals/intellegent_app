import Link from "next/link";

import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/role-badge";
import type { WorkspaceBrowserItem as WorkspaceItem } from "@/components/workspaces/workspace-browser-types";

type WorkspaceBrowserItemProps = {
  workspace: WorkspaceItem;
  active: boolean;
};

export function WorkspaceBrowserItem({
  workspace,
  active,
}: WorkspaceBrowserItemProps) {
  return (
    <Link
      href={`/workspaces/${workspace.slug}`}
      className={cn(
        "group block rounded-2xl border px-3 py-3 transition",
        active
          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
          : "border-transparent text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{workspace.name}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {active ? <span className="h-2.5 w-2.5 rounded-full bg-current opacity-80" /> : null}
          <div
            className={cn(
              "transition-opacity",
              active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            )}
          >
            <RoleBadge role={workspace.role} />
          </div>
        </div>
      </div>
    </Link>
  );
}
