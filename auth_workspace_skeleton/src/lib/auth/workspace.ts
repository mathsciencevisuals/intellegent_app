import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma/client';
import { WorkspaceNotFoundError } from './errors';

export const ACTIVE_WORKSPACE_COOKIE = 'active_workspace_id';

export async function getMembershipForWorkspace(userId: string, workspaceId: string) {
  return prisma.membership.findFirst({
    where: {
      userId,
      workspaceId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      role: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function getDefaultMembership(userId: string) {
  return prisma.membership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: [
      { role: 'desc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      role: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function resolveActiveWorkspace(userId: string) {
  const cookieStore = await cookies();
  const requestedWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (requestedWorkspaceId) {
    const membership = await getMembershipForWorkspace(userId, requestedWorkspaceId);
    if (membership) {
      return membership;
    }
  }

  const fallbackMembership = await getDefaultMembership(userId);
  if (!fallbackMembership) {
    throw new WorkspaceNotFoundError('No active workspace membership found for this user');
  }

  return fallbackMembership;
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
