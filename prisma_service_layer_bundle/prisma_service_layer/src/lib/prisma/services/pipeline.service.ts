import type { Prisma, PrismaClient } from '@prisma/client';
import { createJobSchema, listJobsSchema, toPrismaSkipTake, updateJobProgressSchema } from '../../validation';
import { assertWorkspaceEntity } from '../guards';

export class PipelineService {
  constructor(private readonly prisma: PrismaClient) {}

  async listJobs(input: unknown) {
    const data = listJobsSchema.parse(input);
    const where: Prisma.ExtractionJobWhereInput = {
      workspaceId: data.workspaceId,
      ...(data.documentId ? { documentId: data.documentId } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.status ? { status: data.status } : {}),
    };

    return this.prisma.extractionJob.findMany({
      where,
      include: { document: true },
      orderBy: [{ createdAt: 'desc' }],
      ...toPrismaSkipTake(data.page, data.pageSize),
    });
  }

  async createJob(input: unknown) {
    const data = createJobSchema.parse(input);
    return this.prisma.extractionJob.create({
      data: {
        workspaceId: data.workspaceId,
        documentId: data.documentId,
        startedById: data.startedById,
        type: data.type,
        queueName: data.queueName,
        priority: data.priority,
        inputJson: data.inputJson,
        status: 'QUEUED',
      },
    });
  }

  async updateProgress(input: unknown) {
    const data = updateJobProgressSchema.parse(input);
    await assertWorkspaceEntity(this.prisma.extractionJob.findUnique({ where: { id: data.jobId } }), data.workspaceId, 'ExtractionJob');

    return this.prisma.extractionJob.update({
      where: { id: data.jobId },
      data: {
        progressPct: data.progressPct,
        status: data.status,
        metricsJson: data.metricsJson,
        outputJson: data.outputJson,
        errorMessage: data.errorMessage,
        startedAt: data.progressPct > 0 ? new Date() : undefined,
        finishedAt: data.progressPct === 100 ? new Date() : undefined,
      },
    });
  }
}
