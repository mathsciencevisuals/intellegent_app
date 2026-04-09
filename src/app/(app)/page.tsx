import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  BriefcaseBusiness,
  FileText,
  Clock3,
  Loader2,
  Plus,
  Rocket,
  Upload,
  UserPlus,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecentDocumentStatus = "DRAFT" | "PROCESSING" | "READY" | "FAILED";

function StatusBadge({ status }: { status: RecentDocumentStatus }) {
  const styles =
    status === "READY"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "FAILED"
      ? "bg-red-50 text-red-700 border-red-200"
      : status === "PROCESSING"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default async function AppDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      memberships: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
              updatedAt: true,
              ownerId: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const workspaceIds = user.memberships.map((m) => m.workspaceId);
  const workspaceSlugs = user.memberships.map((m) => m.workspace.slug);

  const [documents, pendingInvites, features] = await Promise.all([
    workspaceIds.length
      ? prisma.document.findMany({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
          },
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([]),
    prisma.workspaceInvite.findMany({
      where: {
        email: user.email,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    workspaceIds.length
      ? prisma.feature.findMany({
          where: {
            workspaceId: {
              in: workspaceIds,
            },
          },
          select: {
            id: true,
            status: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const totals = {
    workspaces: user.memberships.length,
    documents: documents.length,
    pendingInvites: pendingInvites.length,
    processingJobs: documents.filter((doc) => doc.status === "PROCESSING").length,
    approvedFeatures: features.filter((feature) => feature.status === "APPROVED").length,
  };

  const recentDocuments = documents.slice(0, 5);
  const yourWorkspaces = user.memberships.slice(0, 8);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Executive overview"
        title="Workspace dashboard"
        description="Monitor workspaces, documents, pending invites, and processing activity from a single enterprise view."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/onboarding"
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              <span className="inline-flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                First-value setup
              </span>
            </Link>
            <Link
              href="/invites"
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              View invites
            </Link>
            <Link
              href="/workspaces/new"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create workspace
              </span>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Workspaces"
          value={totals.workspaces}
          description="Active memberships"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />
        <StatCard
          title="Documents"
          value={totals.documents}
          description="Across your workspaces"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Pending invites"
          value={totals.pendingInvites}
          description="Awaiting your action"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          title="Processing jobs"
          value={totals.processingJobs}
          description="Documents currently processing"
          icon={<Loader2 className="h-5 w-5" />}
        />
        <StatCard
          title="Approved features"
          value={totals.approvedFeatures}
          description="Reviewed feature candidates"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/onboarding"
                className="rounded-2xl border p-4 transition hover:bg-neutral-50"
              >
                <Rocket className="mb-3 h-5 w-5" />
                <div className="font-medium">Run onboarding</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Create a workspace, connect a source, and trigger the first scan.
                </div>
              </Link>

              <Link
                href="/workspaces/new"
                className="rounded-2xl border p-4 transition hover:bg-neutral-50"
              >
                <Plus className="mb-3 h-5 w-5" />
                <div className="font-medium">Create workspace</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Start a new workspace for a team or function.
                </div>
              </Link>

              <Link
                href={workspaceSlugs.length ? `/workspaces/${workspaceSlugs[0]}` : "/workspaces"}
                className="rounded-2xl border p-4 transition hover:bg-neutral-50"
              >
                <Upload className="mb-3 h-5 w-5" />
                <div className="font-medium">Upload document</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Open a workspace to manage documents.
                </div>
              </Link>

              <Link
                href="/invites"
                className="rounded-2xl border p-4 transition hover:bg-neutral-50"
              >
                <UserPlus className="mb-3 h-5 w-5" />
                <div className="font-medium">Invite member</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Review and manage pending invites.
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Pending invites
            </CardTitle>
            <Link
              href="/invites"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Open
            </Link>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
                No pending invites.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvites.slice(0, 5).map((invite) => (
                  <div key={invite.id} className="rounded-2xl border p-4">
                    <div className="font-medium">{invite.workspace.name}</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Role: {invite.role}
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Invited by: {invite.invitedBy.name || invite.invitedBy.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Your workspaces
            </CardTitle>
            <Link
              href="/workspaces"
              className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Open
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardHeader>

          <CardContent>
            {yourWorkspaces.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <div className="text-base font-medium text-neutral-900">
                  No workspaces yet
                </div>
                <div className="mt-2 text-sm text-neutral-500">
                  Create your first workspace to get started.
                </div>
                <div className="mt-4">
                  <Link
                    href="/workspaces/new"
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    Create workspace
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-left text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Workspace</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {yourWorkspaces.map((membership) => (
                      <tr key={membership.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">{membership.workspace.name}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {membership.role}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {new Date(membership.workspace.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/workspaces/${membership.workspace.slug}`}
                            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Recent documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
                No documents yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{doc.title}</div>
                      <div className="mt-1 text-sm text-neutral-500">
                        {doc.workspace.name}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
