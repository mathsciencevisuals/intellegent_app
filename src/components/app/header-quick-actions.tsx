"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Activity, Bell, Mail, Settings } from "lucide-react";

import { CountBadge } from "@/components/ui/count-badge";
import { cn } from "@/lib/utils";

type QuickAction = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
};

function getWorkspaceActivityHref(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "workspaces" && segments[1]) {
    return `/workspaces/${segments[1]}/activity`;
  }

  return "/notifications";
}

function QuickActionLink({ href, label, icon: Icon, count }: QuickAction) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition",
        "hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
      {typeof count === "number" ? <CountBadge count={count} /> : null}
    </Link>
  );
}

type Props = {
  pendingInviteCount: number;
};

export function HeaderQuickActions({ pendingInviteCount }: Props) {
  const pathname = usePathname();

  const actions: QuickAction[] = [
    {
      href: "/settings",
      label: "Preferences",
      icon: Settings,
    },
    {
      href: "/invites",
      label: "Invites",
      icon: Mail,
      count: pendingInviteCount,
    },
    {
      href: getWorkspaceActivityHref(pathname),
      label: "Activity",
      icon: Activity,
    },
    {
      href: "/notifications",
      label: "Alerts",
      icon: Bell,
    },
  ];

  return (
    <div className="hidden items-center gap-2 md:flex">
      {actions.map((action) => (
        <QuickActionLink key={`${action.label}-${action.href}`} {...action} />
      ))}
    </div>
  );
}
