import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Users,
} from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUtcDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleBadge } from "@/components/ui/role-badge";

type Props = {
  params: Promise<{ slug: string }>;
};

type ActivityEvent = {
  id: string;
  kind: "document" | "member" | "invite";
  title: string;
  description: string;
  timestamp: Date;
  status: string;
};

export default async function WorkspaceActivityPage({ params }: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
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
      documents: {
        orderBy: { updatedAt: "desc" },
        take: 15,
      },
      memberships: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      invites: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          invitedBy: {
            select: {
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

  const documentEvents: ActivityEvent[] = workspace.documents.map((document) => ({
    id: `document-${document.id}`,
    kind: "document",
    title:
      document.status === "FAILED"
        ? `Document failed: ${document.title}`
        : document.status === "READY"
        ? `Document completed: ${document.title}`
        : document.status === "PROCESSING"
        ? `Document processing: ${document.title}`
        : `Document added: ${document.title}`,
    description: document.errorMessage
      ? document.errorMessage
      : document.fileName
      ? `File: ${document.fileName}`
      : "No file metadata provided.",
    timestamp: document.updatedAt,
    status: document.status,
  }));

  const membershipEvents: ActivityEvent[] = workspace.memberships.map((membership) => ({
    id: `member-${membership.id}`,
    kind: "member",
    title: `Member active: ${membership.user.name || membership.user.email}`,
    description: `${membership.user.email} joined this workspace.`,
    timestamp: membership.createdAt,
    status: membership.role,
  }));

  const inviteEvents: ActivityEvent[] = workspace.invites.map((invite) => ({
    id: `invite-${invite.id}`,
    kind: "invite",
    title: `Invite ${invite.status.toLowerCase()}: ${invite.email}`,
    description: `Sent by ${invite.invitedBy.name || invite.invitedBy.email}.`,
    timestamp: invite.createdAt,
    status: invite.status,
  }));

  const events = [...documentEvents, ...membershipEvents, ...inviteEvents]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);

  const documentHealth = {
    ready: workspace.documents.filter((document) => document.status === "READY").length,
    processing: workspace.documents.filter((document) => document.status === "PROCESSING").length,
    failed: workspace.documents.filter((document) => document.status === "FAILED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description={`Operational timeline for ${workspace.name}.`}
        actions={
          <Link
            href={`/workspaces/${workspace.slug}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
          >
            Open documents
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Recent events</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {events.length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Ready documents</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {documentHealth.ready}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Processing documents</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {documentHealth.processing}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Pending invites</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.invites.filter((invite) => invite.status === "PENDING").length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <Activity className="h-5 w-5 text-neutral-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                  No activity yet
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Upload documents or add members to start building a workspace history.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900">{event.title}</div>
                        <div className="mt-1 text-sm text-neutral-600">
                          {event.description}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          {formatUtcDateTime(event.timestamp)}
                        </div>
                      </div>
                      {event.kind === "member" ? (
                        <RoleBadge role={event.status} />
                      ) : (
                        <StatusBadge status={event.status} />
                      )}
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
              <CardTitle>Document health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <div className="font-medium text-neutral-900">Ready</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {documentHealth.ready} document{documentHealth.ready === 1 ? "" : "s"} completed successfully.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Clock3 className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <div className="font-medium text-neutral-900">Processing</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {documentHealth.processing} document{documentHealth.processing === 1 ? "" : "s"} still running.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" />
                  <div>
                    <div className="font-medium text-neutral-900">Failed</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {documentHealth.failed} document{documentHealth.failed === 1 ? "" : "s"} need follow-up.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Workspace operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href={`/workspaces/${workspace.slug}/members`}
                  className="flex items-start gap-3 rounded-2xl border p-4 transition hover:bg-neutral-50"
                >
                  <Users className="mt-0.5 h-5 w-5 text-neutral-600" />
                  <div>
                    <div className="font-medium text-neutral-900">Members</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Review roles and pending invites.
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/workspaces/${workspace.slug}`}
                  className="flex items-start gap-3 rounded-2xl border p-4 transition hover:bg-neutral-50"
                >
                  <FileText className="mt-0.5 h-5 w-5 text-neutral-600" />
                  <div>
                    <div className="font-medium text-neutral-900">Documents</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Open the document queue and upload more files.
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
