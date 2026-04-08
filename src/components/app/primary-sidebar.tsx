import Link from "next/link";
import { ReactNode } from "react";
import {
  LayoutGrid,
  BriefcaseBusiness,
  Mail,
  Bell,
  Settings,
  Plus,
} from "lucide-react";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}

export function PrimarySidebar() {
  return (
    <aside className="flex min-h-screen flex-col border-r border-neutral-800 bg-neutral-950 text-white">
      {/* Logo */}
      <div className="border-b border-neutral-800 px-5 py-5">
        <div className="text-xl font-semibold">SaaS App</div>
        <div className="text-xs text-neutral-400">
          Enterprise workspace hub
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-8">
        <div>
          <p className="px-2 text-xs text-neutral-500 uppercase mb-2">Main</p>
          <div className="space-y-1">
            <NavItem href="/" label="Dashboard" icon={<LayoutGrid size={16} />} />
            <NavItem
              href="/workspaces"
              label="Workspaces"
              icon={<BriefcaseBusiness size={16} />}
            />
            <NavItem href="/invites" label="Invites" icon={<Mail size={16} />} />
          </div>
        </div>

        <div>
          <p className="px-2 text-xs text-neutral-500 uppercase mb-2">
            System
          </p>
          <div className="space-y-1">
            <NavItem
              href="/notifications"
              label="Notifications"
              icon={<Bell size={16} />}
            />
            <NavItem
              href="/settings"
              label="Preferences"
              icon={<Settings size={16} />}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
