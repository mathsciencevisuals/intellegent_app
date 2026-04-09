import type { PrismaClient } from '@prisma/client';
import { createWorkspaceSchema, inviteMemberSchema } from '../../validation';
import { writeAuditLog } from '../audit';

export class WorkspaceService {
  constructor(private readonly prisma: PrismaClient) {}

  async createWorkspace(input: unknown) {
    const data = createWorkspaceSchema.parse(input);

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
          primaryDomain: data.primaryDomain,
          timezone: data.timezone,
          locale: data.locale,
          memberships: {
            create: {
              userId: data.ownerUserId,
              role: 'OWNER',
              joinedAt: new Date(),
            },
          },
        },
      });

      await writeAuditLog(tx, {
        workspaceId: workspace.id,
        actorType: 'USER',
        actorUserId: data.ownerUserId,
        action: 'CREATE',
        entityType: 'Workspace',
        entityId: workspace.id,
        entityLabel: workspace.name,
        afterJson: { slug: workspace.slug },
      });

      return workspace;
    });
  }

  async inviteMember(input: unknown) {
    const data = inviteMemberSchema.parse(input);
    const membership = await this.prisma.membership.create({
      data: {
        workspaceId: data.workspaceId,
        role: data.role,
        title: data.title,
        invitedById: data.invitedById,
        user: {
          connectOrCreate: {
            where: { email: data.email.toLowerCase() },
            create: { email: data.email.toLowerCase(), status: 'INVITED' },
          },
        },
      },
      include: { user: true },
    });

    await writeAuditLog(this.prisma, {
      workspaceId: data.workspaceId,
      actorType: 'USER',
      actorUserId: data.invitedById,
      action: 'CREATE',
      entityType: 'Membership',
      entityId: membership.id,
      entityLabel: membership.user.email,
      afterJson: { role: membership.role },
    });

    return membership;
  }
}
