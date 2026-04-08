import { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";

type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type Props = {
  email: string;
  workspaces: WorkspaceOption[];
  pendingInviteCount?: number;
  currentSlug?: string;
  children: ReactNode;
};

export function AppShell({
  email,
  workspaces,
  pendingInviteCount,
  currentSlug,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader
        email={email}
        workspaces={workspaces}
        pendingInviteCount={pendingInviteCount}
        currentSlug={currentSlug}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
