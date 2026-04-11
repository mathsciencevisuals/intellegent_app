import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Sparkles } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUtcDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AnalysesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: {
      memberships: {
        orderBy: {
          workspace: {
            updatedAt: "desc",
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
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const workspaceIds = user.memberships.map((membership) => membership.workspaceId);
  const jobs = workspaceIds.length
    ? await prisma.extractionJob.findMany({
        where: {
          workspaceId: {
            in: workspaceIds,
          },
        },
        select: {
          id: true,
          status: true,
          featureCount: true,
          createdAt: true,
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
          document: {
            select: {
              id: true,
              title: true,
              source: {
                select: {
                  name: true,
                },
              },
            },
          },
          capabilities: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 24,
      })
    : [];

  const counts = {
    total: jobs.length,
    completed: jobs.filter((job) => job.status === "COMPLETED").length,
    running:
      jobs.filter((job) => job.status === "QUEUED" || job.status === "PROCESSING").length,
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Analyses"
        title="Run history"
        description="Cross-workspace run history stays global here. Open a workspace to read outputs in its Documents, Features, and Reports tabs."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Runs</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{counts.total}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Completed</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{counts.completed}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Running</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900">{counts.running}</div>
        </div>
      </div>

      {jobs.length > 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Features</th>
                    <th className="px-4 py-3 font-medium">Gaps</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t align-top hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{job.workspace.name}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        <div>{job.document.title}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {job.document.source?.name || "Manual upload"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatUtcDateTime(job.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{job.featureCount}</td>
                      <td className="px-4 py-3 text-neutral-600">{job.capabilities.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/workspaces/${job.workspace.slug}?tab=analyses&job=${job.id}`}
                            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                          >
                            Workspace run
                          </Link>
                          <Link
                            href={`/workspaces/${job.workspace.slug}?tab=features&job=${job.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                          >
                            Features
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Sparkles className="h-5 w-5 text-neutral-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">No analysis runs yet</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Start from a workspace document upload or source ingestion flow to create the first run.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
