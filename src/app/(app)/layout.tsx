import { ReactNode } from "react";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderQuickActions } from "@/components/app/header-quick-actions";
import { PrimarySidebar } from "@/components/app/primary-sidebar";
import { ProfileMenu } from "@/components/app/profile-menu";
import { ReturningUserShell } from "@/components/app/returning-user-shell";
import type { WorkspaceBrowserItem } from "@/components/workspaces/workspace-browser-types";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authConfig);

  const normalizedEmail = session?.user?.email?.toLowerCase();

  const user = normalizedEmail
    ? await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          memberships: {
            orderBy: {
              workspace: {
                updatedAt: "desc",
              },
            },
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      })
    : null;

  const completedAnalysisCount = user?.id
    ? await prisma.extractionJob.count({
        where: {
          status: "COMPLETED",
          workspace: {
            memberships: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      })
    : 0;

  const isNewUser = completedAnalysisCount === 0;

  const pendingInvites = normalizedEmail
    ? await prisma.workspaceInvite.count({
        where: {
          email: normalizedEmail,
          status: "PENDING",
        },
      })
    : 0;

  const workspaceBrowserItems: WorkspaceBrowserItem[] = (user?.memberships ?? []).map(
    (membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      createdAt: membership.workspace.createdAt.toISOString(),
      updatedAt: membership.workspace.updatedAt.toISOString(),
    })
  );

  if (!isNewUser && user?.email) {
    return (
      <ReturningUserShell
        workspaces={workspaceBrowserItems}
        pendingInviteCount={pendingInvites}
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceCount: user.memberships.length,
        }}
      >
        {children}
      </ReturningUserShell>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-100 text-neutral-900">
      <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)] overflow-hidden">
        <PrimarySidebar
          homeLabel={isNewUser ? "Home" : "Dashboard"}
          showAnalyses={!isNewUser}
          showRepository={!isNewUser}
        />

        <div className="flex min-w-0 flex-col overflow-x-hidden">
          {/* Top header */}
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">Workspace platform</h1>
              <p className="text-xs text-neutral-500">
                {isNewUser
                  ? "Set up the first workspace and reach the first completed analysis"
                  : "Manage workspaces, analyses, and repository intelligence"}
              </p>
            </div>

            {user?.email ? (
              <div className="flex items-center gap-3">
                <HeaderQuickActions pendingInviteCount={pendingInvites} />
                <ProfileMenu
                  name={user.name}
                  email={user.email}
                  role={user.role}
                  workspaceCount={user.memberships.length}
                  pendingInviteCount={pendingInvites}
                />
              </div>
            ) : null}
          </header>

          {/* Page content */}
          <main className="min-w-0 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
