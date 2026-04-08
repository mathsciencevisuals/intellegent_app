import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FileText,
  FolderOpen,
  Plus,
  Users,
} from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { CountBadge } from "@/components/ui/count-badge";

export default async function WorkspacesLandingPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: {
      memberships: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          workspace: {
            include: {
              documents: {
                select: {
                  id: true,
                  status: true,
                },
              },
              memberships: {
                select: {
                  id: true,
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
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const memberships = user.memberships;
  const manageableMemberships = memberships.filter(
    (membership) => membership.role === "OWNER" || membership.role === "ADMIN"
  );

  const allDocuments = memberships.flatMap((membership) => membership.workspace.documents);
  const processingDocuments = allDocuments.filter(
    (document) => document.status === "PROCESSING"
  ).length;
  const failedDocuments = allDocuments.filter((document) => document.status === "FAILED").length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Workspace browser"
        description="Review all of your workspaces, jump back into active ones, and track document and membership volume from one view."
        actions={
          <Link
            href="/workspaces/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create workspace
            </span>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Workspaces"
          value={memberships.length}
          description="Active memberships"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />
        <StatCard
          title="Documents"
          value={allDocuments.length}
          description="Across your workspaces"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Processing"
          value={processingDocuments}
          description="Documents still running"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          title="Manageable"
          value={manageableMemberships.length}
          description="Owner or admin roles"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent workspaces</CardTitle>
          </CardHeader>
          <CardContent>
            {memberships.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <FolderOpen className="h-5 w-5 text-neutral-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                  No workspaces yet
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Create your first workspace to start managing documents, members,
                  and activity.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {memberships.map((membership) => {
                  const workspace = membership.workspace;
                  const documentCount = workspace.documents.length;
                  const pendingInvites = workspace.invites.length;
                  const memberCount = workspace.memberships.length;

                  return (
                    <Link
                      key={membership.id}
                      href={`/workspaces/${workspace.slug}`}
                      className="block rounded-2xl border p-5 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-semibold text-neutral-900">
                            {workspace.name}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <RoleBadge role={membership.role} />
                            <div className="text-sm text-neutral-500">
                              Created {new Date(workspace.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
                        <span>{documentCount} documents</span>
                        <span>{memberCount} members</span>
                        <span className="inline-flex items-center gap-2">
                          Pending invites
                          <CountBadge count={pendingInvites} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Operational snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm text-neutral-500">Failed documents</div>
                  <div className="mt-2 text-2xl font-semibold text-neutral-900">
                    {failedDocuments}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    Items that may need re-upload or review.
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm text-neutral-500">Pending invites</div>
                  <div className="mt-2 text-2xl font-semibold text-neutral-900">
                    {memberships.reduce(
                      (total, membership) => total + membership.workspace.invites.length,
                      0
                    )}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    Outstanding workspace invitations.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Management shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              {manageableMemberships.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
                  Owner and admin shortcuts will appear here when you manage a workspace.
                </div>
              ) : (
                <div className="space-y-3">
                  {manageableMemberships.slice(0, 5).map((membership) => (
                    <Link
                      key={membership.id}
                      href={`/workspaces/${membership.workspace.slug}/members`}
                      className="block rounded-2xl border p-4 transition hover:bg-neutral-50"
                    >
                      <div className="font-medium text-neutral-900">
                        {membership.workspace.name}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">
                        Open members management and invite controls.
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
