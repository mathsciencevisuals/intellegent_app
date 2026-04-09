import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserRecord() {
  const session = await getServerSession(authConfig);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getWorkspaceAccess(slug: string) {
  const user = await getCurrentUserRecord();

  if (!user) {
    return null;
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
    },
  });

  if (!workspace) {
    return {
      user,
      workspace: null,
      membership: null,
    };
  }

  const membership = workspace.memberships.find(
    (item) => item.userId === user.id
  );

  return {
    user,
    workspace,
    membership: membership ?? null,
  };
}
