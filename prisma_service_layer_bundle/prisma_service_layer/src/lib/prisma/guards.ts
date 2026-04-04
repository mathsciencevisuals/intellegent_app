import type { MembershipRole, PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError } from './errors';

const roleRank: Record<MembershipRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  BILLING_ADMIN: 80,
  PRODUCT_MANAGER: 70,
  REVIEWER: 60,
  ANALYST: 50,
  VIEWER: 10,
};

export async function requireWorkspaceMembership(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
) {
  const membership = await prisma.membership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!membership) {
    throw new ForbiddenError('User is not a member of this workspace');
  }

  return membership;
}

export async function requireWorkspaceRole(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  minimumRole: MembershipRole,
) {
  const membership = await requireWorkspaceMembership(prisma, workspaceId, userId);
  if (roleRank[membership.role] < roleRank[minimumRole]) {
    throw new ForbiddenError(`Action requires at least ${minimumRole}`);
  }
  return membership;
}

export async function assertWorkspaceEntity<T extends { workspaceId: string } | null>(
  promise: Promise<T>,
  workspaceId: string,
  entityName = 'Entity',
): Promise<Exclude<T, null>> {
  const entity = await promise;
  if (!entity) {
    throw new NotFoundError(`${entityName} not found`);
  }
  if (entity.workspaceId !== workspaceId) {
    throw new ForbiddenError(`${entityName} does not belong to the current workspace`);
  }
  return entity as Exclude<T, null>;
}
