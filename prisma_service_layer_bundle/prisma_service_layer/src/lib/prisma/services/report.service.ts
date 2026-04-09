import type { Prisma, PrismaClient } from '@prisma/client';
import { createReportSchema, listReportsSchema, saveViewSchema, toPrismaSkipTake } from '../../validation';

export class ReportService {
  constructor(private readonly prisma: PrismaClient) {}

  async listReports(input: unknown) {
    const data = listReportsSchema.parse(input);
    const where: Prisma.ReportWhereInput = {
      workspaceId: data.workspaceId,
      ...(data.type ? { type: data.type } : {}),
      ...(data.status ? { status: data.status } : {}),
    };

    return this.prisma.report.findMany({
      where,
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
      ...toPrismaSkipTake(data.page, data.pageSize),
    });
  }

  async createReport(input: unknown) {
    const data = createReportSchema.parse(input);
    return this.prisma.report.create({
      data: {
        workspaceId: data.workspaceId,
        createdById: data.createdById,
        type: data.type,
        name: data.name,
        description: data.description,
        filtersJson: data.filtersJson,
        status: 'DRAFT',
        scheduledCron: data.scheduledCron,
      },
    });
  }

  async saveView(input: unknown) {
    const data = saveViewSchema.parse(input);
    return this.prisma.savedView.create({ data });
  }
}
