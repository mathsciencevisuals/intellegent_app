import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { CountBadge } from "@/components/ui/count-badge";

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
};

export function AppHeader({
  email,
  workspaces,
  pendingInviteCount = 0,
  currentSlug,
}: Props) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            SaaS App
          </Link>

          {workspaces.length > 0 ? (
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentSlug={currentSlug}
            />
          ) : null}

          <Link
            href="/invites"
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black"
          >
            <span>Invites</span>
            <CountBadge count={pendingInviteCount} />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-600">{email}</div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
