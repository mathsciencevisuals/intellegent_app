"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Pencil, Users, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { WorkspaceTabHeaderActionsSlot } from "@/components/workspaces/workspace-tab-header-actions-slot";

type WorkspaceDetailHeaderProps = {
  slug: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

type WorkspaceLink = {
  label: string;
  tab?: string;
  href?: string;
  adminOnly?: boolean;
};

type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceLink[];
  adminOnly?: boolean;
};

type ActionMenuKey = "setup" | "administration" | "edit";

type WorkspaceActionGroup = WorkspaceNavGroup & {
  key: ActionMenuKey;
  icon: LucideIcon;
};

const PRIMARY_LINKS: WorkspaceLink[] = [
  { label: "Overview", tab: "overview" },
  { label: "Documents", tab: "documents" },
  { label: "Sources", tab: "sources" },
  { label: "Analyses", tab: "analyses" },
  { label: "Features", tab: "features" },
  { label: "Reports", tab: "reports" },
];

const ACTION_GROUPS: WorkspaceActionGroup[] = [
  {
    key: "setup",
    label: "Workspace",
    icon: BarChart3,
    items: [
      { label: "Open documents", href: "?tab=documents" },
      { label: "Open sources", href: "?tab=sources" },
      { label: "Open analyses", href: "?tab=analyses" },
      { label: "Open reports", href: "?tab=reports" },
    ],
  },
  {
    key: "administration",
    label: "Workspace actions",
    icon: Users,
    items: [
      { label: "Members", href: "/members" },
      { label: "Activity", href: "/activity" },
      { label: "Workspace settings", href: "/settings", adminOnly: true },
      { label: "AI models", href: "/settings#ai-models", adminOnly: true },
    ],
  },
  {
    key: "edit",
    label: "Edit",
    icon: Pencil,
    adminOnly: true,
    items: [
      { label: "Change workspace", href: "/settings#rename-workspace", adminOnly: true },
      { label: "Delete workspace", href: "/settings#delete-workspace", adminOnly: true },
    ],
  },
];

function IconButton({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900"
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function WorkspaceDetailHeader({
  slug,
  name,
  role,
}: WorkspaceDetailHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openMenu, setOpenMenu] = useState<ActionMenuKey | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const basePath = `/workspaces/${slug}`;
  const isAdminLike = role === "OWNER" || role === "ADMIN";
  const activeTab = searchParams.get("tab") ?? "overview";

  const isPathActive = (href: string) => {
    const tabMatch = href.match(/[?&]tab=([^&#]+)/);

    if (tabMatch) {
      return pathname === basePath && activeTab === tabMatch[1];
    }

    const [pathWithoutHash] = href.split("#");

    if (href === basePath) {
      return pathname === basePath;
    }

    return (
      pathname === pathWithoutHash ||
      pathname?.startsWith(`${pathWithoutHash}/`)
    );
  };

  const getPrimaryHref = (tab?: string) => {
    if (!tab || tab === "overview") {
      return basePath;
    }

    return `${basePath}?tab=${tab}`;
  };

  const visiblePrimaryLinks = PRIMARY_LINKS.filter(
    (link) => !link.adminOnly || isAdminLike
  );
  const visibleGroups = ACTION_GROUPS.filter(
    (group) => !group.adminOnly || isAdminLike
  )
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdminLike),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="border-b border-neutral-200 bg-neutral-50" ref={headerRef}>
      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="min-w-0">
          <p className="text-[11pt] font-semibold uppercase tracking-[0.18em] text-neutral-400 [font-family:Calibri,Carlito,'Segoe_UI',sans-serif]">
            Workspace
          </p>
          <h1 className="mt-2 truncate text-[11pt] font-semibold tracking-tight text-neutral-900 [font-family:Calibri,Carlito,'Segoe_UI',sans-serif]">
            {name}
          </h1>
        </div>

        <div className="flex flex-col gap-4 border-t border-neutral-200 pt-3 lg:flex-row lg:items-end lg:justify-between">
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {visiblePrimaryLinks.map((link) => {
              const href = getPrimaryHref(link.tab);
              const active =
                pathname === basePath &&
                ((link.tab ?? "overview") === activeTab ||
                  ((link.tab ?? "overview") === "overview" && !searchParams.get("tab")));

              return (
                <Link
                  key={link.label}
                  href={href}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center border-b-2 px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
                    active
                      ? "border-neutral-900 text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 self-start lg:self-auto">
            <WorkspaceTabHeaderActionsSlot />
            <div className="hidden h-6 w-px bg-neutral-200 sm:block" />

            {visibleGroups.map((group) => {
              const hasActiveChild = group.items.some((item) =>
                isPathActive(`${basePath}${item.href}`)
              );
              const isOpen = openMenu === group.key;

              return (
                <div key={group.key} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === group.key ? null : group.key
                      )
                    }
                    className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
                    aria-label={group.label}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                  >
                    <IconButton
                      icon={group.icon}
                      label={group.label}
                      active={isOpen || hasActiveChild}
                    />
                  </button>

                  {isOpen ? (
                    <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
                      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        {group.label}
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const href = item.href?.startsWith("?")
                            ? `${basePath}${item.href}`
                            : `${basePath}${item.href}`;
                          const active = isPathActive(href);

                          return (
                            <Link
                              key={item.label}
                              href={href}
                              onClick={() => setOpenMenu(null)}
                              className={cn(
                                "block rounded-xl px-3 py-2 text-sm transition",
                                active
                                  ? "bg-neutral-900 text-white"
                                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                              )}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
