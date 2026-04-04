import {
  ApprovalStatus,
  DocumentStatus,
  ExtractionJobStatus,
  ExtractionJobType,
  Prisma,
  SourceStatus,
  SourceType,
} from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { inferDocumentType } from '@/lib/uploads/document-types';
import { processExtractionJob } from '@/lib/uploads/mock-extraction';

function priorityToInt(priority?: 'LOW' | 'NORMAL' | 'HIGH') {
  if (priority === 'LOW') return 75;
  if (priority === 'HIGH') return 25;
  return 50;
}

export const services = {
  source: {
    async ensureUploadSource(params: { workspaceId: string; createdById: string }) {
      const existing = await prisma.source.findFirst({
        where: {
          workspaceId: params.workspaceId,
          type: SourceType.PDF_UPLOAD,
          name: 'Manual Uploads',
        },
      });

      if (existing) return existing;

      return prisma.source.create({
        data: {
          workspaceId: params.workspaceId,
          type: SourceType.PDF_UPLOAD,
          name: 'Manual Uploads',
          status: SourceStatus.ACTIVE,
          configJson: {
            createdById: params.createdById,
            purpose: 'Direct document uploads',
          } satisfies Prisma.JsonObject,
        },
      });
    },
  },

  document: {
    async createUploadedDocument(params: {
      workspaceId: string;
      uploadedById: string;
      sourceId?: string | null;
      title: string;
      storageKey: string;
      mimeType: string;
      checksum: string;
      sizeBytes: number;
      rawText?: string;
      metadata?: Record<string, unknown>;
    }) {
      return prisma.document.create({
        data: {
          workspaceId: params.workspaceId,
          uploadedById: params.uploadedById,
          sourceId: params.sourceId ?? null,
          type: inferDocumentType(params.title, params.mimeType),
          status: DocumentStatus.UPLOADED,
          title: params.title,
          storageKey: params.storageKey,
          mimeType: params.mimeType,
          checksum: params.checksum,
          rawText: params.rawText,
          metadataJson: {
            sizeBytes: params.sizeBytes,
            ...params.metadata,
          } satisfies Prisma.JsonObject,
        },
      });
    },

    async getById(params: { workspaceId: string; documentId: string }) {
      return prisma.document.findFirst({
        where: {
          id: params.documentId,
          workspaceId: params.workspaceId,
        },
        include: {
          extractionJobs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          featureSources: {
            include: {
              feature: true,
            },
          },
        },
      });
    },
  },

  pipeline: {
    async createJob(params: {
      workspaceId: string;
      createdById: string;
      documentId?: string;
      sourceId?: string;
      kind?: 'INGEST' | 'PARSE' | 'EXTRACT' | 'DEDUP' | 'CLASSIFY';
      priority?: 'LOW' | 'NORMAL' | 'HIGH';
      input?: Record<string, unknown>;
    }) {
      const typeMap: Record<string, ExtractionJobType> = {
        INGEST: ExtractionJobType.INGEST,
        PARSE: ExtractionJobType.PARSE,
        EXTRACT: ExtractionJobType.EXTRACT_FEATURES,
        DEDUP: ExtractionJobType.DEDUPLICATE,
        CLASSIFY: ExtractionJobType.CLASSIFY,
      };

      return prisma.extractionJob.create({
        data: {
          workspaceId: params.workspaceId,
          startedById: params.createdById,
          documentId: params.documentId,
          type: typeMap[params.kind || 'EXTRACT'] ?? ExtractionJobType.EXTRACT_FEATURES,
          status: ExtractionJobStatus.QUEUED,
          priority: priorityToInt(params.priority),
          inputJson: {
            sourceId: params.sourceId,
            ...params.input,
          } satisfies Prisma.JsonObject,
        },
      });
    },

    async listJobs(params: { workspaceId: string; status?: string; kind?: string; take?: number }) {
      return prisma.extractionJob.findMany({
        where: {
          workspaceId: params.workspaceId,
          status: params.status as ExtractionJobStatus | undefined,
          type: params.kind as ExtractionJobType | undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: params.take ?? 20,
        include: { document: true },
      });
    },

    async getById(params: { workspaceId: string; jobId: string }) {
      return prisma.extractionJob.findFirst({
        where: {
          id: params.jobId,
          workspaceId: params.workspaceId,
        },
        include: { document: true },
      });
    },

    async runExtractionJob(params: { workspaceId: string; jobId: string }) {
      const job = await prisma.extractionJob.findFirst({
        where: {
          id: params.jobId,
          workspaceId: params.workspaceId,
        },
      });
      if (!job) return null;
      return processExtractionJob(job.id);
    },
  },

  feature: {
    async list(params: { workspaceId: string; q?: string; module?: string; status?: string; take?: number }) {
      return prisma.feature.findMany({
        where: {
          workspaceId: params.workspaceId,
          module: params.module || undefined,
          status: params.status as any,
          OR: params.q
            ? [
                { title: { contains: params.q, mode: 'insensitive' } },
                { summary: { contains: params.q, mode: 'insensitive' } },
                { description: { contains: params.q, mode: 'insensitive' } },
              ]
            : undefined,
        },
        orderBy: { updatedAt: 'desc' },
        take: params.take ?? 25,
        include: {
          sources: {
            include: {
              document: true,
            },
          },
          approvals: true,
        },
      });
    },

    async getById(params: { workspaceId: string; featureId: string }) {
      return prisma.feature.findFirst({
        where: { id: params.featureId, workspaceId: params.workspaceId },
        include: {
          versions: { orderBy: { versionNumber: 'desc' }, take: 10 },
          sources: { include: { document: true } },
          approvals: { include: { reviewer: true } },
          comments: { include: { author: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
    },

    async approve(params: {
      workspaceId: string;
      featureId: string;
      reviewerId: string;
      decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
      note?: string;
    }) {
      const existing = await prisma.approval.findFirst({
        where: {
          workspaceId: params.workspaceId,
          featureId: params.featureId,
          reviewerId: params.reviewerId,
        },
      });

      const approval = existing
        ? await prisma.approval.update({
            where: { id: existing.id },
            data: {
              status: params.decision as ApprovalStatus,
              notes: params.note,
              decidedAt: new Date(),
            },
          })
        : await prisma.approval.create({
            data: {
              workspaceId: params.workspaceId,
              featureId: params.featureId,
              reviewerId: params.reviewerId,
              status: params.decision as ApprovalStatus,
              notes: params.note,
              decidedAt: new Date(),
            },
          });

      return approval;
    },
  },
};
