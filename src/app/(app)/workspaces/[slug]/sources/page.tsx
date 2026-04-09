import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { DatabaseZap, FolderSync, Link2 } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SOURCE_TYPE_LABELS, SYNC_FREQUENCY_LABELS } from "@/lib/sources";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreateSourceForm } from "@/components/workspaces/create-source-form";
import { SourceSyncButton } from "@/components/workspaces/source-sync-button";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function WorkspaceSourcesPage({ params }: Props) {
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
      sources: {
        include: {
          documents: {
            select: {
              id: true,
            },
          },
          syncs: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Sources"
        description={`Register systems and manual channels that feed ${workspace.name}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Connected sources</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.sources.length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Manual uploads</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.sources.filter((source) => source.type === "MANUAL_UPLOAD").length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Needs attention</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">
            {workspace.sources.filter((source) => source.status === "NEEDS_ATTENTION").length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Add source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateSourceForm slug={workspace.slug} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseZap className="h-5 w-5" />
              Source management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workspace.sources.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
                No sources yet. Create a source to link uploads, simulate syncs, and feed the extraction pipeline.
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.sources.map((source) => (
                  <div key={source.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-neutral-900">{source.name}</div>
                          <StatusBadge status={source.status} />
                        </div>
                        <div className="text-sm text-neutral-600">
                          Type: {SOURCE_TYPE_LABELS[source.type]} • Frequency:{" "}
                          {SYNC_FREQUENCY_LABELS[source.syncFrequency]}
                        </div>
                        <div className="text-sm text-neutral-600">
                          Documents linked: {source.documents.length}
                        </div>
                        <div className="text-sm text-neutral-600">
                          Last sync:{" "}
                          {source.lastSyncedAt
                            ? new Date(source.lastSyncedAt).toLocaleString()
                            : "Never"}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {source.syncs[0]?.summary ||
                            source.connectionNotes ||
                            "No sync notes recorded yet."}
                        </div>
                      </div>

                      <div className="min-w-[120px]">
                        <SourceSyncButton slug={workspace.slug} sourceId={source.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync className="h-5 w-5" />
            Latest sync outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workspace.sources.every((source) => source.syncs.length === 0) ? (
            <div className="rounded-2xl border border-dashed p-8 text-sm text-neutral-500">
              No sync runs yet.
            </div>
          ) : (
            <div className="space-y-3">
              {workspace.sources
                .flatMap((source) =>
                  source.syncs.map((sync) => ({
                    sourceName: source.name,
                    sync,
                  }))
                )
                .sort(
                  (left, right) =>
                    new Date(right.sync.createdAt).getTime() -
                    new Date(left.sync.createdAt).getTime()
                )
                .slice(0, 8)
                .map(({ sourceName, sync }) => (
                  <div key={sync.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-neutral-900">{sourceName}</div>
                        <div className="mt-1 text-sm text-neutral-600">
                          {sync.summary || "No summary provided."}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          {new Date(sync.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <StatusBadge status={sync.status} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
