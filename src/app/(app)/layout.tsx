import { ReactNode } from "react";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrimarySidebar } from "@/components/app/primary-sidebar";
import { ProfileMenu } from "@/components/app/profile-menu";

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
          name: true,
          email: true,
          role: true,
          memberships: {
            select: {
              id: true,
            },
          },
        },
      })
    : null;

  const pendingInvites = normalizedEmail
    ? await prisma.workspaceInvite.count({
        where: {
          email: normalizedEmail,
          status: "PENDING",
        },
      })
    : 0;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="grid min-h-screen grid-cols-[240px_minmax(0,1fr)]">
        <PrimarySidebar />

        <div className="flex min-w-0 flex-col">
          {/* Top header */}
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">Workspace platform</h1>
              <p className="text-xs text-neutral-500">
                Manage workspaces, documents and members
              </p>
            </div>

            {user?.email ? (
              <ProfileMenu
                name={user.name}
                email={user.email}
                role={user.role}
                workspaceCount={user.memberships.length}
                pendingInviteCount={pendingInvites}
              />
            ) : null}
          </header>

          {/* Page content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
