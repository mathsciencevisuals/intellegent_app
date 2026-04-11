import type { ReactNode } from "react";

import { HeaderQuickActions } from "@/components/app/header-quick-actions";
import { DefaultContextPane } from "@/components/app/default-context-pane";
import { ProfileMenu } from "@/components/app/profile-menu";
import { ReturningUserRail } from "@/components/app/returning-user-rail";
import type { WorkspaceBrowserItem } from "@/components/workspaces/workspace-browser-types";

type Props = {
  children: ReactNode;
  workspaces: WorkspaceBrowserItem[];
  pendingInviteCount: number;
  user: {
    name?: string | null;
    email: string;
    role: string;
    workspaceCount: number;
  };
};

export function ReturningUserShell({
  children,
  workspaces,
  pendingInviteCount,
  user,
}: Props) {
  return (
    <div className="grid min-h-screen grid-cols-[72px_320px_minmax(0,1fr)] overflow-hidden bg-neutral-100 text-neutral-900">
      <ReturningUserRail />
      <DefaultContextPane workspaces={workspaces} />

      <div className="flex min-w-0 min-h-screen flex-col">
        <header className="flex items-center justify-end border-b border-neutral-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <HeaderQuickActions pendingInviteCount={pendingInviteCount} />
            <ProfileMenu
              name={user.name}
              email={user.email}
              role={user.role}
              workspaceCount={user.workspaceCount}
              pendingInviteCount={pendingInviteCount}
            />
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
