"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Layers3, Library, Sparkles, UserRound } from "lucide-react";

import { AnalysisBrowserPane } from "@/components/analyses/analysis-browser-pane";
import { SectionContextPane } from "@/components/app/section-context-pane";
import { DashboardContextPane } from "@/components/dashboard/dashboard-context-pane";
import { RepositoryBrowserPane } from "@/components/repository/repository-browser-pane";
import { WorkspaceBrowserList } from "@/components/workspaces/workspace-browser-list";
import type { WorkspaceBrowserItem } from "@/components/workspaces/workspace-browser-types";

type Props = {
  workspaces: WorkspaceBrowserItem[];
};

type ContextConfig = {
  eyebrow: string;
  title: string;
  description: string;
  body: ReactNode;
};

function PlaceholderBody({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4">
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4 text-sm font-medium text-neutral-900">{title}</div>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
      </div>
    </div>
  );
}

function getContextConfig(pathname: string, workspaces: WorkspaceBrowserItem[]): ContextConfig {
  if (pathname.startsWith("/workspaces")) {
    return {
      eyebrow: "Workspace browser",
      title: "Workspaces",
      description:
        "Select a workspace here. The full workspace operating surface stays in the detail pane.",
      body: <WorkspaceBrowserList workspaces={workspaces} />,
    };
  }

  if (pathname.startsWith("/invites")) {
    return {
      eyebrow: "Invite queue",
      title: "Invites",
      description:
        "Incoming and sent invite selectors will move here. The current invite center remains in the detail pane in Phase 1.",
      body: (
        <PlaceholderBody
          icon={Layers3}
          title="Invite selection comes next"
          description="Pane 2 will take over invite queue browsing once the current combined page is split into selector and detail surfaces."
        />
      ),
    };
  }

  if (pathname.startsWith("/notifications")) {
    return {
      eyebrow: "Notification feed",
      title: "Notifications",
      description:
        "Recent events and attention items will be browsed here once the notification page is migrated into the shared shell.",
      body: (
        <PlaceholderBody
          icon={Sparkles}
          title="Notification list comes next"
          description="Phase 1 keeps the existing notification feed in pane 3 while establishing the shared desktop shell."
        />
      ),
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      eyebrow: "Preference categories",
      title: "Preferences",
      description:
        "Profile, security, and account categories will move into pane 2. The current settings page remains unchanged in pane 3.",
      body: (
        <PlaceholderBody
          icon={UserRound}
          title="Settings categories come next"
          description="Once migrated, this pane will own category selection and the detail pane will focus on the selected settings form."
        />
      ),
    };
  }
  return {
    eyebrow: "Section context",
    title: "Context",
    description: "Additional section-specific selectors and filters will appear here.",
    body: (
      <PlaceholderBody
        icon={Library}
        title="Context pane"
        description="This section has not been migrated into the shared selector shell yet."
      />
    ),
  };
}

export function DefaultContextPane({ workspaces }: Props) {
  const pathname = usePathname();

  if (pathname.startsWith("/workspaces")) {
    return <WorkspaceBrowserList workspaces={workspaces} />;
  }

  if (pathname.startsWith("/analyses")) {
    return <AnalysisBrowserPane />;
  }

  if (pathname.startsWith("/repository")) {
    return <RepositoryBrowserPane />;
  }

  if (pathname === "/") {
    return <DashboardContextPane />;
  }

  const config = getContextConfig(pathname, workspaces);

  return (
    <SectionContextPane
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
    >
      {config.body}
    </SectionContextPane>
  );
}
