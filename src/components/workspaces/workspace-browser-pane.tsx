import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceBrowserList } from "@/components/workspaces/workspace-browser-list";

type WorkspaceBrowserPaneProps = {
  activeSlug?: string;
};

export async function WorkspaceBrowserPane({
  activeSlug,
}: WorkspaceBrowserPaneProps) {
  const session = await getServerSession(authConfig);

  const user =
    session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
        select: {
          id: true,
          workspaceListDensity: true,
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
                  },
                },
              },
            },
          },
        })
      : null;

  const memberships = user?.memberships ?? [];
  const workspaces = memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    role: membership.role,
  }));

  return (
    <WorkspaceBrowserList
      activeSlug={activeSlug}
      workspaces={workspaces}
      density={user?.workspaceListDensity ?? "COMFORTABLE"}
    />
  );
}
