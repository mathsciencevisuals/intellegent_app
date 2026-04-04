import type { Prisma, PrismaClient } from '@prisma/client';
import { createDocumentSchema, listDocumentsSchema, toPrismaSkipTake, updateDocumentStatusSchema } from '../../validation';
import { assertWorkspaceEntity } from '../guards';

export class DocumentService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(input: unknown) {
    const data = listDocumentsSchema.parse(input);
    const where: Prisma.DocumentWhereInput = {
      workspaceId: data.workspaceId,
      ...(data.sourceId ? { sourceId: data.sourceId } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.search ? { title: { contains: data.search, mode: 'insensitive' } } : {}),
    };

    return this.prisma.document.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: 'desc' },
      ...toPrismaSkipTake(data.page, data.pageSize),
    });
  }

  async create(input: unknown) {
    const data = createDocumentSchema.parse(input);
    return this.prisma.document.create({ data });
  }

  async updateStatus(input: unknown) {
    const data = updateDocumentStatusSchema.parse(input);
    await assertWorkspaceEntity(this.prisma.document.findUnique({ where: { id: data.documentId } }), data.workspaceId, 'Document');
    return this.prisma.document.update({
      where: { id: data.documentId },
      data: { status: data.status, extractedAt: data.extractedAt ?? undefined },
    });
  }
}
