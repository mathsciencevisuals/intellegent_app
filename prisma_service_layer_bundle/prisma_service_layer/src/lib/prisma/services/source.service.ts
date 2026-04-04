import type { Prisma, PrismaClient } from '@prisma/client';
import { createSourceSchema, listSourcesSchema, triggerSourceSyncSchema, updateSourceSchema, toPrismaSkipTake } from '../../validation';
import { assertWorkspaceEntity } from '../guards';
import { writeAuditLog } from '../audit';

export class SourceService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(input: unknown) {
    const data = listSourcesSchema.parse(input);
    const where: Prisma.SourceWhereInput = {
      workspaceId: data.workspaceId,
      ...(data.type ? { type: data.type } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.search
        ? { OR: [{ name: { contains: data.search, mode: 'insensitive' } }, { externalId: { contains: data.search, mode: 'insensitive' } }] }
        : {}),
    };

    return this.prisma.source.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      ...toPrismaSkipTake(data.page, data.pageSize),
    });
  }

  async create(input: unknown) {
    const data = createSourceSchema.parse(input);
    const source = await this.prisma.source.create({
      data: {
        workspaceId: data.workspaceId,
        integrationCredentialId: data.integrationCredentialId,
        type: data.type,
        name: data.name,
        externalId: data.externalId,
        syncFrequencyMinutes: data.syncFrequencyMinutes,
        configJson: data.configJson,
        status: 'CONNECTED',
      },
    });

    await writeAuditLog(this.prisma, {
      workspaceId: data.workspaceId,
      actorType: 'SYSTEM',
      action: 'CREATE',
      entityType: 'Source',
      entityId: source.id,
      entityLabel: source.name,
      afterJson: { type: source.type },
    });

    return source;
  }

  async update(input: unknown) {
    const data = updateSourceSchema.parse(input);
    const current = await assertWorkspaceEntity(
      this.prisma.source.findUnique({ where: { id: data.sourceId } }),
      data.workspaceId,
      'Source',
    );

    const updated = await this.prisma.source.update({
      where: { id: data.sourceId },
      data: {
        name: data.name,
        status: data.status,
        syncFrequencyMinutes: data.syncFrequencyMinutes,
        configJson: data.configJson,
        lastError: data.lastError,
      },
    });

    await writeAuditLog(this.prisma, {
      workspaceId: data.workspaceId,
      actorType: 'SYSTEM',
      action: 'UPDATE',
      entityType: 'Source',
      entityId: updated.id,
      entityLabel: updated.name,
      beforeJson: { status: current.status, name: current.name },
      afterJson: { status: updated.status, name: updated.name },
    });

    return updated;
  }

  async triggerSync(input: unknown) {
    const data = triggerSourceSyncSchema.parse(input);
    await assertWorkspaceEntity(this.prisma.source.findUnique({ where: { id: data.sourceId } }), data.workspaceId, 'Source');

    return this.prisma.sourceSync.create({
      data: {
        workspaceId: data.workspaceId,
        sourceId: data.sourceId,
        status: 'QUEUED',
        metadataJson: data.metadataJson,
      },
    });
  }
}
