import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { WorkspaceDetailHeader } from "@/components/workspaces/workspace-detail-header";
import { getWorkspaceAccess } from "@/lib/workspaces";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function WorkspaceDetailLayout({
  children,
  params,
}: Props) {
  const { slug } = await params;
  const access = await getWorkspaceAccess(slug);

  if (!access?.user) {
    redirect("/login");
  }

  const { workspace, membership: currentMembership } = access;

  if (!workspace || !currentMembership) {
    notFound();
  }

  return (
    <div className="min-h-full min-w-0 bg-neutral-50">
      <WorkspaceDetailHeader
        slug={workspace.slug}
        name={workspace.name}
        role={currentMembership.role}
      />

      <div className="min-w-0 bg-white p-6">{children}</div>
    </div>
  );
}
