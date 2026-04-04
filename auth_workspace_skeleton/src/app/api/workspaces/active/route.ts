import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { getRequestContext } from '@/lib/auth/session';
import { setActiveWorkspaceCookie } from '@/lib/auth/workspace';
import { fail, ok } from '@/lib/auth/api';
import { ForbiddenError } from '@/lib/auth/errors';

const bodySchema = z.object({
  workspaceId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const body = bodySchema.parse(await request.json());

    const membership = await prisma.membership.findFirst({
      where: {
        userId: ctx.userId,
        workspaceId: body.workspaceId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
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
    });

    if (!membership) {
      throw new ForbiddenError('You do not belong to that workspace');
    }

    await setActiveWorkspaceCookie(membership.workspaceId);

    await prisma.auditLog.create({
      data: {
        workspaceId: membership.workspaceId,
        actorUserId: ctx.userId,
        action: 'workspace.switch',
        entityType: 'Workspace',
        entityId: membership.workspaceId,
        metadataJson: {
          switchedTo: membership.workspace.slug,
        },
      },
    });

    return ok({
      workspace: membership.workspace,
      role: membership.role,
    });
  } catch (error) {
    return fail(error);
  }
}
