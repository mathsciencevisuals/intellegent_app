import type { Prisma, PrismaClient } from '@prisma/client';
import {
  addFeatureRelationSchema,
  approveFeatureSchema,
  createCommentSchema,
  createFeatureSchema,
  listFeaturesSchema,
  mergeFeaturesSchema,
  toPrismaSkipTake,
  updateFeatureSchema,
} from '../../validation';
import { assertWorkspaceEntity } from '../guards';
import { writeAuditLog } from '../audit';
import { ConflictError } from '../errors';

export class FeatureService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(input: unknown) {
    const data = listFeaturesSchema.parse(input);
    const where: Prisma.FeatureWhereInput = {
      workspaceId: data.workspaceId,
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.module ? { module: data.module } : {}),
      ...(data.productArea ? { productArea: data.productArea } : {}),
      ...(data.ownerTeam ? { ownerTeam: data.ownerTeam } : {}),
      ...(data.search
        ? {
            OR: [
              { title: { contains: data.search, mode: 'insensitive' } },
              { summary: { contains: data.search, mode: 'insensitive' } },
              { description: { contains: data.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.feature.findMany({
      where,
      include: {
        sources: { include: { document: true } },
        approvals: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
      ...toPrismaSkipTake(data.page, data.pageSize),
    });
  }

  async getById(workspaceId: string, featureId: string) {
    return assertWorkspaceEntity(
      this.prisma.feature.findUnique({
        where: { id: featureId },
        include: {
          sources: { include: { document: true } },
          versions: { orderBy: { versionNumber: 'desc' } },
          approvals: true,
          comments: { include: { author: true } },
        },
      }),
      workspaceId,
      'Feature',
    );
  }

  async create(input: unknown) {
    const data = createFeatureSchema.parse(input);
    return this.prisma.$transaction(async (tx) => {
      const feature = await tx.feature.create({
        data: {
          workspaceId: data.workspaceId,
          createdById: data.createdById,
          updatedById: data.createdById,
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          acceptanceCriteria: data.acceptanceCriteria,
          priority: data.priority,
          customerSegment: data.customerSegment,
          module: data.module,
          productArea: data.productArea,
          ownerTeam: data.ownerTeam,
          confidenceScore: data.confidenceScore,
          duplicateScore: data.duplicateScore,
          metadataJson: data.metadataJson,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          sources: data.sourceDocumentIds?.length
            ? {
                create: data.sourceDocumentIds.map((documentId) => ({
                  workspaceId: data.workspaceId,
                  documentId,
                  isPrimary: false,
                })),
              }
            : undefined,
        },
      });

      await tx.featureVersion.create({
        data: {
          workspaceId: data.workspaceId,
          featureId: feature.id,
          versionNumber: 1,
          changedById: data.createdById,
          title: feature.title,
          summary: feature.summary,
          description: feature.description,
          acceptanceCriteria: feature.acceptanceCriteria,
          status: feature.status,
          confidenceScore: feature.confidenceScore,
          snapshotJson: feature as unknown as Prisma.InputJsonValue,
        },
      });

      await writeAuditLog(tx, {
        workspaceId: data.workspaceId,
        actorType: data.createdById ? 'USER' : 'SYSTEM',
        actorUserId: data.createdById,
        action: 'CREATE',
        entityType: 'Feature',
        entityId: feature.id,
        entityLabel: feature.title,
        afterJson: { slug: feature.slug, status: feature.status },
      });

      return feature;
    });
  }

  async update(input: unknown) {
    const data = updateFeatureSchema.parse(input);
    const current = await assertWorkspaceEntity(this.prisma.feature.findUnique({ where: { id: data.featureId } }), data.workspaceId, 'Feature');

    return this.prisma.$transaction(async (tx) => {
      const feature = await tx.feature.update({
        where: { id: data.featureId },
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          acceptanceCriteria: data.acceptanceCriteria,
          priority: data.priority,
          customerSegment: data.customerSegment,
          module: data.module,
          productArea: data.productArea,
          ownerTeam: data.ownerTeam,
          confidenceScore: data.confidenceScore,
          duplicateScore: data.duplicateScore,
          metadataJson: data.metadataJson,
          status: data.status,
          updatedById: data.updatedById,
          lastSeenAt: new Date(),
        },
      });

      const latestVersion = await tx.featureVersion.aggregate({
        where: { featureId: feature.id },
        _max: { versionNumber: true },
      });

      await tx.featureVersion.create({
        data: {
          workspaceId: data.workspaceId,
          featureId: feature.id,
          versionNumber: (latestVersion._max.versionNumber ?? 0) + 1,
          changedById: data.updatedById,
          title: feature.title,
          summary: feature.summary,
          description: feature.description,
          acceptanceCriteria: feature.acceptanceCriteria,
          status: feature.status,
          confidenceScore: feature.confidenceScore,
          snapshotJson: feature as unknown as Prisma.InputJsonValue,
        },
      });

      await writeAuditLog(tx, {
        workspaceId: data.workspaceId,
        actorType: data.updatedById ? 'USER' : 'SYSTEM',
        actorUserId: data.updatedById,
        action: 'UPDATE',
        entityType: 'Feature',
        entityId: feature.id,
        entityLabel: feature.title,
        beforeJson: { title: current.title, status: current.status },
        afterJson: { title: feature.title, status: feature.status },
      });

      return feature;
    });
  }

  async approve(input: unknown) {
    const data = approveFeatureSchema.parse(input);
    await assertWorkspaceEntity(this.prisma.feature.findUnique({ where: { id: data.featureId } }), data.workspaceId, 'Feature');

    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.approval.upsert({
        where: {
          id: `${data.featureId}:${data.reviewerId}`,
        },
        update: {
          status: data.status,
          notes: data.notes,
          decidedAt: new Date(),
        },
        create: {
          id: `${data.featureId}:${data.reviewerId}`,
          workspaceId: data.workspaceId,
          featureId: data.featureId,
          reviewerId: data.reviewerId,
          status: data.status,
          notes: data.notes,
          decidedAt: new Date(),
        },
      });

      await tx.feature.update({
        where: { id: data.featureId },
        data: { status: data.status === 'APPROVED' ? 'APPROVED' : 'IN_REVIEW' },
      });

      return approval;
    });
  }

  async merge(input: unknown) {
    const data = mergeFeaturesSchema.parse(input);
    if (data.mergedFeatureIds.includes(data.canonicalFeatureId)) {
      throw new ConflictError('Canonical feature cannot also be merged into itself');
    }

    return this.prisma.$transaction(async (tx) => {
      const canonical = await assertWorkspaceEntity(tx.feature.findUnique({ where: { id: data.canonicalFeatureId } }), data.workspaceId, 'Feature');
      const merged = await tx.feature.findMany({
        where: { id: { in: data.mergedFeatureIds }, workspaceId: data.workspaceId },
      });

      if (merged.length !== data.mergedFeatureIds.length) {
        throw new ConflictError('One or more features to merge were not found in this workspace');
      }

      await tx.feature.updateMany({
        where: { id: { in: data.mergedFeatureIds } },
        data: {
          canonicalFeatureId: canonical.id,
          status: 'MERGED',
          updatedById: data.changedById,
        },
      });

      await writeAuditLog(tx, {
        workspaceId: data.workspaceId,
        actorType: data.changedById ? 'USER' : 'SYSTEM',
        actorUserId: data.changedById,
        action: 'MERGE',
        entityType: 'Feature',
        entityId: canonical.id,
        entityLabel: canonical.title,
        afterJson: { mergedFeatureIds: data.mergedFeatureIds, notes: data.notes },
      });

      return { canonicalFeatureId: canonical.id, mergedFeatureIds: data.mergedFeatureIds };
    });
  }

  async addRelation(input: unknown) {
    const data = addFeatureRelationSchema.parse(input);
    if (data.fromFeatureId === data.toFeatureId) {
      throw new ConflictError('A feature cannot be related to itself');
    }

    return this.prisma.featureRelation.create({
      data: {
        workspaceId: data.workspaceId,
        fromFeatureId: data.fromFeatureId,
        toFeatureId: data.toFeatureId,
        relationType: data.relationType,
        confidenceScore: data.confidenceScore,
        evidenceJson: data.evidenceJson,
      },
    });
  }

  async addComment(input: unknown) {
    const data = createCommentSchema.parse(input);
    return this.prisma.comment.create({
      data: {
        workspaceId: data.workspaceId,
        featureId: data.featureId,
        reportId: data.reportId,
        authorId: data.authorId,
        parentCommentId: data.parentCommentId,
        body: data.body,
        visibility: data.visibility,
        mentionsJson: data.mentionsJson ? { userIds: data.mentionsJson } : undefined,
      },
      include: { author: true },
    });
  }
}
