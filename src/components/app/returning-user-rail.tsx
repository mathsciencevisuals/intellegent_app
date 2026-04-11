"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  ActivitySquare,
  Bell,
  LayoutGrid,
  Library,
  Mail,
  Settings,
  BriefcaseBusiness,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RailItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

const RAIL_ITEMS: RailItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutGrid,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/workspaces",
    label: "Workspaces",
    icon: BriefcaseBusiness,
    match: (pathname) => pathname.startsWith("/workspaces"),
  },
  {
    href: "/analyses",
    label: "Analyses",
    icon: ActivitySquare,
    match: (pathname) => pathname.startsWith("/analyses"),
  },
  {
    href: "/repository",
    label: "Repository",
    icon: Library,
    match: (pathname) => pathname.startsWith("/repository"),
  },
  {
    href: "/invites",
    label: "Invites",
    icon: Mail,
    match: (pathname) => pathname.startsWith("/invites"),
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    match: (pathname) => pathname.startsWith("/notifications"),
  },
  {
    href: "/settings",
    label: "Preferences",
    icon: Settings,
    match: (pathname) => pathname.startsWith("/settings"),
  },
];

export function ReturningUserRail() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-[72px] flex-col items-center border-r border-neutral-200 bg-neutral-950 px-3 py-4 text-white">
      <Link
        href="/"
        aria-label="Dashboard home"
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white"
      >
        SA
      </Link>

      <nav className="mt-6 flex flex-1 flex-col items-center gap-2" aria-label="Primary">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match ? item.match(pathname) : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
                active
                  ? "border-neutral-700 bg-neutral-800 text-white"
                  : "border-transparent text-neutral-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
