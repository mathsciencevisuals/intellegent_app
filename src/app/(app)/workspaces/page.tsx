import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const recentWorkspace = user.memberships[0]?.workspace;

  return (
    <div className="min-w-0 p-6">
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-full max-w-3xl rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Workspace detail
                </p>
                <CardTitle className="mt-2 text-3xl">Select a workspace</CardTitle>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                  Choose a workspace from pane 2 to open its overview, documents, sources, analyses, features, and reports in this detail pane.
                </p>
              </div>

              <Link
                href="/workspaces/new"
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                New
              </Link>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-neutral-100 p-2">
                  <BriefcaseBusiness className="h-4 w-4 text-neutral-700" />
                </div>
                <div>
                  <div className="font-medium text-neutral-900">Master-detail workspace view</div>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Pane 2 is the workspace browser only. Pane 3 stays focused on the selected workspace and its local operating surface.
                  </p>
                </div>
              </div>
            </div>

            {recentWorkspace ? (
              <Link
                href={`/workspaces/${recentWorkspace.slug}`}
                className="flex items-center justify-between rounded-2xl border p-5 transition hover:bg-neutral-50"
              >
                <div>
                  <div className="text-sm text-neutral-500">Resume recent workspace</div>
                  <div className="mt-2 font-medium text-neutral-900">
                    {recentWorkspace.name}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-500" />
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed p-5 text-sm text-neutral-500">
                No workspaces yet. Create one to start uploading documents and running the pipeline.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
