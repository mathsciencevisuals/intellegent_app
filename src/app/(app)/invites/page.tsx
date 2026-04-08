import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Mail, Send, Users } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteActions } from "@/components/workspaces/invite-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvitesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const [incomingInvites, sentPendingInvites] = await Promise.all([
    prisma.workspaceInvite.findMany({
      where: {
        email,
        status: "PENDING",
      },
      include: {
        workspace: true,
        invitedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.workspaceInvite.findMany({
      where: {
        invitedById: user.id,
        status: "PENDING",
      },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const manageableMemberships = user.memberships.filter(
    (membership) => membership.role === "OWNER" || membership.role === "ADMIN"
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Invites"
        title="Invite center"
        description="Review invites sent to you, send new invites from your workspaces, and track pending invites you have already sent."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Incoming invites</CardTitle>
          </CardHeader>
          <CardContent>
            {incomingInvites.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                  No pending invites
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Accept or decline invites here when someone adds you to a workspace.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-2xl border bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-neutral-900">
                          {invite.workspace.name}
                        </div>

                        <div className="text-sm text-neutral-500">
                          Role:{" "}
                          <span className="font-medium text-neutral-700">
                            {invite.role}
                          </span>
                        </div>

                        <div className="text-sm text-neutral-500">
                          Invited by:{" "}
                          <span className="font-medium text-neutral-700">
                            {invite.invitedBy.name || invite.invitedBy.email}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-500">
                          Sent on {new Date(invite.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <InviteActions inviteId={invite.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Send invites</CardTitle>
            </CardHeader>
            <CardContent>
              {manageableMemberships.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                  You do not currently manage any workspace where you can send invites.
                </div>
              ) : (
                <div className="space-y-3">
                  {manageableMemberships.map((membership) => (
                    <Link
                      key={membership.id}
                      href={`/workspaces/${membership.workspace.slug}/members`}
                      className="block rounded-2xl border p-4 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {membership.workspace.name}
                          </div>
                          <div className="mt-1 text-sm text-neutral-500">
                            Role: {membership.role}
                          </div>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                          <Send className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-neutral-600">
                        Open members page to add a member or send an invite.
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pending invites you sent</CardTitle>
            </CardHeader>
            <CardContent>
              {sentPendingInvites.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                  No pending invites sent by you.
                </div>
              ) : (
                <div className="space-y-3">
                  {sentPendingInvites.map((invite) => (
                    <div key={invite.id} className="rounded-2xl border p-4">
                      <div className="font-medium text-neutral-900">
                        {invite.email}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">
                        Workspace: {invite.workspace.name}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">
                        Role: {invite.role}
                      </div>
                      <div className="mt-2 text-xs text-neutral-500">
                        Sent on {new Date(invite.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Members management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-2xl border p-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                  <Users className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <div className="font-medium text-neutral-900">
                    Invite actions live inside each workspace
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    Open a workspace members page to add existing users immediately
                    or create email invites for people who have not signed up yet.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
