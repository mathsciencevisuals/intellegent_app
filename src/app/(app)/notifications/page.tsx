import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
} from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  href: string;
  status: string;
  tone: "critical" | "warning" | "info" | "success";
};

function formatTimestamp(value: Date) {
  return new Date(value).toLocaleString();
}

function toneClasses(tone: NotificationItem["tone"]) {
  switch (tone) {
    case "critical":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "success":
      return "border-emerald-200 bg-emerald-50";
    default:
      return "border-neutral-200 bg-white";
  }
}

export default async function NotificationsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      memberships: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          workspaceId: true,
          createdAt: true,
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const workspaceIds = user.memberships.map((membership) => membership.workspaceId);

  const [incomingInvites, sentInvites, recentDocuments] = await Promise.all([
    prisma.workspaceInvite.findMany({
      where: {
        email: user.email,
        status: "PENDING",
      },
      include: {
        workspace: {
          select: {
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    }),
    prisma.workspaceInvite.findMany({
      where: {
        invitedById: user.id,
        status: "PENDING",
      },
      include: {
        workspace: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    }),
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
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 24,
        })
      : Promise.resolve([]),
  ]);

  const failedDocuments = recentDocuments.filter((document) => document.status === "FAILED");
  const processingDocuments = recentDocuments.filter(
    (document) => document.status === "PROCESSING"
  );
  const readyDocuments = recentDocuments.filter((document) => document.status === "READY");

  const attentionItems: NotificationItem[] = [
    ...incomingInvites.map((invite) => ({
      id: `incoming-${invite.id}`,
      title: `Workspace invite: ${invite.workspace.name}`,
      description: `You were invited as ${invite.role} by ${
        invite.invitedBy.name || invite.invitedBy.email
      }.`,
      timestamp: invite.createdAt,
      href: "/invites",
      status: invite.status,
      tone: "warning" as const,
    })),
    ...failedDocuments.map((document) => ({
      id: `failed-${document.id}`,
      title: `Document failed: ${document.title}`,
      description: document.errorMessage
        ? `${document.workspace.name}: ${document.errorMessage}`
        : `${document.workspace.name}: processing ended with a failure.`,
      timestamp: document.updatedAt,
      href: `/workspaces/${document.workspace.slug}`,
      status: document.status,
      tone: "critical" as const,
    })),
    ...processingDocuments.map((document) => ({
      id: `processing-${document.id}`,
      title: `Processing in progress: ${document.title}`,
      description: `${document.workspace.name} is still processing this document.`,
      timestamp: document.updatedAt,
      href: `/workspaces/${document.workspace.slug}`,
      status: document.status,
      tone: "info" as const,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  const updates: NotificationItem[] = [
    ...readyDocuments.map((document) => ({
      id: `ready-${document.id}`,
      title: `Document ready: ${document.title}`,
      description: `${document.workspace.name} finished processing successfully.`,
      timestamp: document.updatedAt,
      href: `/workspaces/${document.workspace.slug}`,
      status: document.status,
      tone: "success" as const,
    })),
    ...sentInvites.map((invite) => ({
      id: `sent-${invite.id}`,
      title: `Invite pending for ${invite.email}`,
      description: `Awaiting response for ${invite.workspace.name}.`,
      timestamp: invite.createdAt,
      href: "/invites",
      status: invite.status,
      tone: "info" as const,
    })),
    ...user.memberships.map((membership) => ({
      id: `membership-${membership.workspaceId}`,
      title: `Workspace access active: ${membership.workspace.name}`,
      description: `You currently hold the ${membership.role} role in this workspace.`,
      timestamp: membership.createdAt,
      href: `/workspaces/${membership.workspace.slug}`,
      status: membership.role,
      tone: "info" as const,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 12);

  const counts = {
    attention: attentionItems.length,
    incomingInvites: incomingInvites.length,
    failedDocuments: failedDocuments.length,
    processingDocuments: processingDocuments.length,
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="System"
        title="Notifications"
        description="Review current alerts and workflow updates generated from invites, document processing, and workspace activity."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/invites"
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
            >
              Open invites
            </Link>
            <Link
              href="/workspaces"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Open workspaces
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Needs attention</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {counts.attention}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Incoming invites</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {counts.incomingInvites}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Failed documents</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {counts.failedDocuments}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Processing now</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {counts.processingDocuments}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent>
            {attentionItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <Bell className="h-5 w-5 text-neutral-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                  No active alerts
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Pending invites and document issues will surface here as they happen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attentionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`block rounded-2xl border p-4 transition hover:shadow-sm ${toneClasses(
                      item.tone
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900">{item.title}</div>
                        <div className="mt-1 text-sm text-neutral-600">
                          {item.description}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          {formatTimestamp(item.timestamp)}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Alert types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-neutral-900">
                      Failed document processing
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {failedDocuments.length === 0
                        ? "No current failures."
                        : `${failedDocuments.length} document ${
                            failedDocuments.length === 1 ? "needs" : "need"
                          } review.`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Mail className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <div className="font-medium text-neutral-900">
                      Pending invite decisions
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {incomingInvites.length === 0
                        ? "No incoming invites waiting on you."
                        : `${incomingInvites.length} invite ${
                            incomingInvites.length === 1 ? "is" : "are"
                          } waiting for action.`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
                  <Clock3 className="mt-0.5 h-5 w-5 text-neutral-600" />
                  <div>
                    <div className="font-medium text-neutral-900">
                      Active processing
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {processingDocuments.length === 0
                        ? "No documents are processing right now."
                        : `${processingDocuments.length} document ${
                            processingDocuments.length === 1 ? "is" : "are"
                          } still running.`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href="/invites"
                  className="flex items-start gap-3 rounded-2xl border p-4 transition hover:bg-neutral-50"
                >
                  <Mail className="mt-0.5 h-5 w-5 text-neutral-600" />
                  <div>
                    <div className="font-medium text-neutral-900">Invite center</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Accept, decline, or review pending invitations.
                    </div>
                  </div>
                </Link>

                <Link
                  href="/workspaces"
                  className="flex items-start gap-3 rounded-2xl border p-4 transition hover:bg-neutral-50"
                >
                  <Activity className="mt-0.5 h-5 w-5 text-neutral-600" />
                  <div>
                    <div className="font-medium text-neutral-900">Workspace browser</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Jump to a workspace to review document and member activity.
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent updates</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
              No recent updates yet.
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border p-4 transition hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900">{item.title}</div>
                      <div className="mt-1 text-sm text-neutral-600">
                        {item.description}
                      </div>
                      <div className="mt-2 text-xs text-neutral-500">
                        {formatTimestamp(item.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.tone === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : null}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
