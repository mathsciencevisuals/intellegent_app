"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  FileText,
  Users,
  Settings,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WorkspaceSidebarCounts = {
  documents?: number;
  members?: number;
  pendingInvites?: number;
};

type WorkspaceSidebarProps = {
  slug: string;
  workspaceName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  counts?: WorkspaceSidebarCounts;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  hidden?: boolean;
  match?: (pathname: string) => boolean;
};

function CountBadge({ value }: { value?: number }) {
  if (typeof value !== "number") return null;

  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
      {value}
    </span>
  );
}

export function WorkspaceSidebar({
  slug,
  workspaceName,
  role,
  counts,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();

  const isAdminLike = role === "OWNER" || role === "ADMIN";

  const items = useMemo<NavItem[]>(
    () => [
      {
        label: "Documents",
        href: `/workspaces/${slug}`,
        icon: FileText,
        count: counts?.documents,
        match: (p) => p === `/workspaces/${slug}`,
      },
      {
        label: "Members",
        href: `/workspaces/${slug}/members`,
        icon: Users,
        count:
          typeof counts?.members === "number" && typeof counts?.pendingInvites === "number"
            ? counts.members + counts.pendingInvites
            : counts?.members,
        match: (p) => p.startsWith(`/workspaces/${slug}/members`),
      },
      {
        label: "Settings",
        href: `/workspaces/${slug}/settings`,
        icon: Settings,
        hidden: !isAdminLike,
        match: (p) => p.startsWith(`/workspaces/${slug}/settings`),
      },
      {
        label: "Activity",
        href: `/workspaces/${slug}/activity`,
        icon: Activity,
        match: (p) => p.startsWith(`/workspaces/${slug}/activity`),
      },
    ],
    [slug, counts, isAdminLike]
  );

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="border-b p-4 dark:border-neutral-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
          Workspace
        </p>
        <h2 className="mt-1 truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {workspaceName}
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Role: {role}
        </p>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {items
            .filter((item) => !item.hidden)
            .map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active
                            ? "text-white dark:text-neutral-900"
                            : "text-neutral-500 dark:text-neutral-400"
                        )}
                      />
                      <span className="truncate font-medium">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!active ? <CountBadge value={item.count} /> : null}
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          active
                            ? "text-white/80 dark:text-neutral-700"
                            : "text-neutral-400 group-hover:translate-x-0.5"
                        )}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="border-t p-3 dark:border-neutral-800">
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Quick summary
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="text-neutral-500 dark:text-neutral-400">Docs</div>
              <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                {counts?.documents ?? 0}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="text-neutral-500 dark:text-neutral-400">Members</div>
              <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                {counts?.members ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
