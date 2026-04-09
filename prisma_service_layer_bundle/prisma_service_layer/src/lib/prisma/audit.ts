import type { AuditAction, AuditActorType, Prisma, PrismaClient } from '@prisma/client';

export async function writeAuditLog(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: {
    workspaceId: string;
    actorType: AuditActorType;
    actorUserId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string;
    entityLabel?: string | null;
    beforeJson?: Prisma.InputJsonValue | null;
    afterJson?: Prisma.InputJsonValue | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  return prisma.auditLog.create({ data: input });
}
