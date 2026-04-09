"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function WorkspaceTabs({
  slug,
}: {
  slug: string;
  active?: string;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "Documents", path: `/workspaces/${slug}` },
    { name: "Sources", path: `/workspaces/${slug}/sources` },
    { name: "Pipeline", path: `/workspaces/${slug}/pipeline` },
    { name: "Features", path: `/workspaces/${slug}/features` },
    { name: "Reports", path: `/workspaces/${slug}/reports` },
    { name: "Members", path: `/workspaces/${slug}/members` },
    { name: "Activity", path: `/workspaces/${slug}/activity` },
    { name: "Settings", path: `/workspaces/${slug}/settings` },
  ];

  return (
    <div className="border-b bg-white px-6">
      <div className="flex gap-3 overflow-x-auto py-1">
        {tabs.map((tab) => {
          const active =
            pathname === tab.path ||
            (tab.name === "Features" &&
              pathname.startsWith(`/workspaces/${slug}/features/`));

          return (
            <Link
              key={tab.name}
              href={tab.path}
              className={`px-4 py-2 text-sm rounded-t-lg ${
                active
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
