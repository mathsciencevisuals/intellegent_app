import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
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

type WorkspacesSortKey = "name" | "createdAt" | "documents" | "members" | "invites";
type SortDirection = "asc" | "desc";

function getSingleSearchParam(
  value: string | string[] | undefined
) {
  return Array.isArray(value) ? value[0] : value;
}

function getNextSortDirection(
  currentKey: WorkspacesSortKey,
  currentDirection: SortDirection,
  clickedKey: WorkspacesSortKey
) {
  if (currentKey !== clickedKey) {
    return clickedKey === "createdAt" ? "desc" : "asc";
  }

  return currentDirection === "asc" ? "desc" : "asc";
}

function SortHeader({
  label,
  href,
  active,
  direction,
}: {
  label: string;
  href: string;
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 hover:text-neutral-700">
      {label}
      {!active ? (
        <ArrowUpDown className="h-3.5 w-3.5" />
      ) : direction === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}
    </Link>
  );
}

export default async function WorkspacesLandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string | string[];
    direction?: string | string[];
  }>;
}) {
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

  const resolvedSearchParams = await searchParams;
  const sortParam = getSingleSearchParam(resolvedSearchParams.sort);
  const directionParam = getSingleSearchParam(resolvedSearchParams.direction);
  const sortKey: WorkspacesSortKey =
    sortParam === "createdAt" ||
    sortParam === "documents" ||
    sortParam === "members" ||
    sortParam === "invites"
      ? sortParam
      : "name";
  const sortDirection: SortDirection =
    directionParam === "asc" || directionParam === "desc" ? directionParam : "asc";

  const memberships = [...user.memberships].sort((left, right) => {
    if (sortKey === "createdAt") {
      const comparison =
        new Date(left.workspace.createdAt).getTime() -
        new Date(right.workspace.createdAt).getTime();

      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (sortKey === "documents") {
      const comparison = left.workspace.documents.length - right.workspace.documents.length;

      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (sortKey === "members") {
      const comparison = left.workspace.memberships.length - right.workspace.memberships.length;

      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (sortKey === "invites") {
      const comparison = left.workspace.invites.length - right.workspace.invites.length;

      return sortDirection === "asc" ? comparison : -comparison;
    }

    const comparison = left.workspace.name.localeCompare(right.workspace.name, undefined, {
      sensitivity: "base",
    });

    return sortDirection === "asc" ? comparison : -comparison;
  });
  const manageableMemberships = memberships.filter(
    (membership) => membership.role === "OWNER" || membership.role === "ADMIN"
  );

  const allDocuments = memberships.flatMap((membership) => membership.workspace.documents);
  const processingDocuments = allDocuments.filter(
    (document) => document.status === "PROCESSING"
  ).length;
  const failedDocuments = allDocuments.filter((document) => document.status === "FAILED").length;
  const workspaceSortDirection = getNextSortDirection(
    sortKey,
    sortDirection,
    "name"
  );
  const createdSortDirection = getNextSortDirection(
    sortKey,
    sortDirection,
    "createdAt"
  );
  const documentsSortDirection = getNextSortDirection(
    sortKey,
    sortDirection,
    "documents"
  );
  const membersSortDirection = getNextSortDirection(
    sortKey,
    sortDirection,
    "members"
  );
  const invitesSortDirection = getNextSortDirection(
    sortKey,
    sortDirection,
    "invites"
  );
  const workspaceSortHref = `/workspaces?sort=name&direction=${workspaceSortDirection}`;
  const createdSortHref = `/workspaces?sort=createdAt&direction=${createdSortDirection}`;
  const documentsSortHref = `/workspaces?sort=documents&direction=${documentsSortDirection}`;
  const membersSortHref = `/workspaces?sort=members&direction=${membersSortDirection}`;
  const invitesSortHref = `/workspaces?sort=invites&direction=${invitesSortDirection}`;

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
              <div className="overflow-hidden rounded-2xl border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-neutral-50 text-left text-neutral-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          <SortHeader
                            label="Workspace"
                            href={workspaceSortHref}
                            active={sortKey === "name"}
                            direction={sortKey === "name" ? sortDirection : "asc"}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">
                          <SortHeader
                            label="Documents"
                            href={documentsSortHref}
                            active={sortKey === "documents"}
                            direction={sortKey === "documents" ? sortDirection : "asc"}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <SortHeader
                            label="Members"
                            href={membersSortHref}
                            active={sortKey === "members"}
                            direction={sortKey === "members" ? sortDirection : "asc"}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <SortHeader
                            label="Invites"
                            href={invitesSortHref}
                            active={sortKey === "invites"}
                            direction={sortKey === "invites" ? sortDirection : "asc"}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <SortHeader
                            label="Created"
                            href={createdSortHref}
                            active={sortKey === "createdAt"}
                            direction={sortKey === "createdAt" ? sortDirection : "desc"}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberships.map((membership) => {
                        const workspace = membership.workspace;
                        const documentCount = workspace.documents.length;
                        const pendingInvites = workspace.invites.length;
                        const memberCount = workspace.memberships.length;

                        return (
                          <tr key={membership.id} className="border-t align-middle hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              <Link
                                href={`/workspaces/${workspace.slug}`}
                                className="block font-medium text-neutral-900"
                              >
                                {workspace.name}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <RoleBadge role={membership.role} />
                            </td>
                            <td className="px-4 py-3 text-neutral-600">{documentCount}</td>
                            <td className="px-4 py-3 text-neutral-600">{memberCount}</td>
                            <td className="px-4 py-3 text-neutral-600">
                              {pendingInvites > 0 ? <CountBadge count={pendingInvites} /> : 0}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {new Date(workspace.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/workspaces/${workspace.slug}`}
                                className="inline-flex items-center gap-1 font-medium text-neutral-700 hover:text-neutral-900"
                              >
                                Open
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
