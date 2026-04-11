"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BriefcaseBusiness,
  ActivitySquare,
  Library,
  Mail,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const Icon = icon;

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-white" : "text-neutral-400"
        )}
      />
      <span className="truncate font-medium text-white/90">{label}</span>
    </Link>
  );
}

type PrimarySidebarProps = {
  homeLabel: "Home" | "Dashboard";
  showAnalyses: boolean;
  showRepository: boolean;
};

export function PrimarySidebar({
  homeLabel,
  showAnalyses,
  showRepository,
}: PrimarySidebarProps) {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-neutral-800 bg-neutral-950 text-white">
      {/* Logo */}
      <div className="flex w-full border-b border-neutral-800 px-4 py-5">
        <div className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold">
          SA
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-8 px-3 py-6">
        <div>
          <div className="space-y-1">
            <NavItem href="/" label={homeLabel} icon={LayoutGrid} />
            <NavItem href="/workspaces" label="Workspaces" icon={BriefcaseBusiness} />
            {showAnalyses ? (
              <NavItem href="/analyses" label="Analyses" icon={ActivitySquare} />
            ) : null}
            {showRepository ? (
              <NavItem href="/repository" label="Repository" icon={Library} />
            ) : null}
            <NavItem href="/invites" label="Invites" icon={Mail} />
            <NavItem href="/notifications" label="Notifications" icon={Bell} />
          </div>
        </div>

        <div>
          <div className="space-y-1">
            <NavItem href="/settings" label="Preferences" icon={Settings} />
          </div>
        </div>
      </div>
    </aside>
  );
}
