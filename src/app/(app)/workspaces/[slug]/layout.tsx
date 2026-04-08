import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceTabs } from "@/components/workspaces/workspace-tabs";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function WorkspaceDetailLayout({
  children,
  params,
}: Props) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
      memberships: true,
      documents: true,
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

  return (
    <div className="min-w-0">
      <div className="border-b bg-white px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Workspace
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
          {workspace.name}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Role: {currentMembership.role}
        </p>
      </div>

      <WorkspaceTabs slug={workspace.slug} active="documents" />

      <div className="p-6">{children}</div>
    </div>
  );
}
