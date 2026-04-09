import { getRequestContext } from './session';
import { prisma } from '@/lib/prisma/client';

export async function getCurrentWorkspaceSummary() {
  const ctx = await getRequestContext();

  const memberships = await prisma.membership.findMany({
    where: {
      userId: ctx.userId,
      status: 'ACTIVE',
    },
    select: {
      workspaceId: true,
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return {
    currentWorkspaceId: ctx.workspaceId,
    currentRole: ctx.role,
    workspaces: memberships,
  };
}
