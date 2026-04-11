import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddMemberForm } from "@/components/workspaces/add-member-form";
import { MemberActions } from "@/components/workspaces/member-actions";
import { canManageMembers } from "@/lib/permissions/workspace";
import { formatUtcDateTime } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/role-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WorkspaceMembersPage({ params }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  if (!user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      memberships: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      invites: {
        where: {
          status: "PENDING",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const currentMembership = workspace.memberships.find(
    (membership) => membership.userId === user.id
  );

  const canManage = currentMembership
    ? canManageMembers(currentMembership.role)
    : false;

  const totalMembers = workspace.memberships.length;
  const totalAdmins = workspace.memberships.filter(
    (membership) =>
      membership.role === "OWNER" || membership.role === "ADMIN"
  ).length;
  const totalPendingInvites = workspace.invites.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Members"
        description={`Manage members and pending invites for ${workspace.name}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="text-sm text-neutral-500">Total members</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900">
              {totalMembers}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="text-sm text-neutral-500">Admins / owners</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900">
              {totalAdmins}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="text-sm text-neutral-500">Pending invites</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900">
              {totalPendingInvites}
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Add member</CardTitle>
          </CardHeader>
          <CardContent>
            <AddMemberForm slug={workspace.slug} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Pending invites</CardTitle>
        </CardHeader>
        <CardContent>
          {workspace.invites.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
              No pending invites.
            </div>
          ) : (
            <div className="space-y-3">
              {workspace.invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border p-4">
                  <div className="font-medium text-neutral-900">{invite.email}</div>
                  <div className="mt-2">
                    <RoleBadge role={invite.role} />
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Invited by: {invite.invitedBy.name || invite.invitedBy.email}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    Sent: {formatUtcDateTime(invite.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Workspace members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workspace.memberships.map((membership) => (
              <div key={membership.id} className="rounded-2xl border p-4">
                <div className="font-medium text-neutral-900">
                  {membership.user.name || membership.user.email}
                </div>
                <div className="text-sm text-neutral-600">
                  {membership.user.email}
                </div>
                <div className="mt-2">
                  <RoleBadge role={membership.role} />
                </div>
                <div className="mt-2 text-sm text-neutral-600">
                  Joined: {formatUtcDateTime(membership.createdAt)}
                </div>

                {canManage ? (
                  <div className="mt-4">
                    <MemberActions
                      slug={workspace.slug}
                      membershipId={membership.id}
                      currentRole={membership.role}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
