import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AlertTriangle,
  ArrowRightLeft,
  PencilLine,
  Settings,
  ShieldAlert,
} from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceOwner } from "@/lib/permissions/workspace";
import { RenameWorkspaceForm } from "@/components/workspaces/rename-workspace-form";
import { TransferOwnershipForm } from "@/components/workspaces/transfer-ownership-form";
import { DeleteWorkspaceForm } from "@/components/workspaces/delete-workspace-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/role-badge";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function WorkspaceSettingsPage({ params }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: { userId: user.id },
      },
    },
    include: {
      documents: {
        select: {
          id: true,
          status: true,
        },
      },
      invites: {
        where: {
          status: "PENDING",
        },
        select: {
          id: true,
        },
      },
      memberships: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: true,
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

  if (!currentMembership) {
    notFound();
  }

  const isOwner = isWorkspaceOwner(currentMembership.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={`Manage ownership, naming, and lifecycle controls for ${workspace.name}.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Your role</div>
          <div className="mt-3">
            <RoleBadge role={currentMembership.role} />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Members</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.memberships.length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Documents</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.documents.length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Pending invites</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.invites.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                <Settings className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Workspace profile</CardTitle>
                <CardDescription>
                  Core metadata and ownership context for this workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Name
                </div>
                <div className="mt-2 text-lg font-semibold text-neutral-900">
                  {workspace.name}
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Slug
                </div>
                <div className="mt-2 text-lg font-semibold text-neutral-900">
                  {workspace.slug}
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Owner
                </div>
                <div className="mt-2 text-lg font-semibold text-neutral-900">
                  {workspace.memberships.find((membership) => membership.role === "OWNER")?.user
                    .name ||
                    workspace.memberships.find((membership) => membership.role === "OWNER")?.user
                      .email}
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Access
                </div>
                <div className="mt-2 text-lg font-semibold text-neutral-900">
                  {isOwner ? "Full control" : "Read-only settings"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isOwner ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <div className="font-medium text-neutral-900">
                    Owner access confirmed
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    You can rename the workspace, transfer ownership, and delete it.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <div className="font-medium text-neutral-900">
                    Owner action required
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    Only the workspace owner can change naming, ownership, or deletion controls.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isOwner ? (
        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                  <PencilLine className="h-5 w-5 text-neutral-700" />
                </div>
                <div>
                  <CardTitle className="text-lg">Rename workspace</CardTitle>
                  <CardDescription>
                    Update the workspace name and regenerate its slug when needed.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RenameWorkspaceForm
                slug={workspace.slug}
                currentName={workspace.name}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                  <ArrowRightLeft className="h-5 w-5 text-neutral-700" />
                </div>
                <div>
                  <CardTitle className="text-lg">Transfer ownership</CardTitle>
                  <CardDescription>
                    Hand control of this workspace to another existing member.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TransferOwnershipForm
                slug={workspace.slug}
                currentOwnerUserId={workspace.ownerId}
                members={workspace.memberships.map((membership) => ({
                  membershipId: membership.id,
                  userId: membership.userId,
                  name: membership.user.name || membership.user.email,
                  email: membership.user.email,
                  role: membership.role,
                }))}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-700" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-700">Danger zone</CardTitle>
                  <CardDescription>
                    Permanently remove this workspace and all associated records.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DeleteWorkspaceForm slug={workspace.slug} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
