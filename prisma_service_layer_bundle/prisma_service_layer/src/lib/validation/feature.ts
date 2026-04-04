import { z } from 'zod';
import { cuidSchema, jsonRecordSchema, nameSchema, optionalTextSchema, paginationSchema, slugSchema } from './common';
import { approvalStatusSchema, commentVisibilitySchema, featurePrioritySchema, featureStatusSchema, relationTypeSchema } from './enums';

export const listFeaturesSchema = paginationSchema.extend({
  workspaceId: cuidSchema,
  status: featureStatusSchema.optional(),
  priority: featurePrioritySchema.optional(),
  module: z.string().trim().max(200).optional(),
  productArea: z.string().trim().max(200).optional(),
  ownerTeam: z.string().trim().max(200).optional(),
  search: z.string().trim().max(200).optional(),
});

export const createFeatureSchema = z.object({
  workspaceId: cuidSchema,
  createdById: cuidSchema.optional(),
  title: nameSchema,
  slug: slugSchema,
  summary: optionalTextSchema,
  description: optionalTextSchema,
  acceptanceCriteria: optionalTextSchema,
  priority: featurePrioritySchema.optional().nullable(),
  customerSegment: z.string().trim().max(200).optional(),
  module: z.string().trim().max(200).optional(),
  productArea: z.string().trim().max(200).optional(),
  ownerTeam: z.string().trim().max(200).optional(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  duplicateScore: z.number().min(0).max(1).optional().nullable(),
  metadataJson: jsonRecordSchema.optional(),
  sourceDocumentIds: z.array(cuidSchema).optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial().extend({
  workspaceId: cuidSchema,
  featureId: cuidSchema,
  updatedById: cuidSchema.optional(),
  title: nameSchema.optional(),
  slug: slugSchema.optional(),
  status: featureStatusSchema.optional(),
}).omit({ createdById: true, sourceDocumentIds: true });

export const approveFeatureSchema = z.object({
  workspaceId: cuidSchema,
  featureId: cuidSchema,
  reviewerId: cuidSchema,
  status: approvalStatusSchema.refine((v) => v !== 'PENDING', 'Decision cannot remain pending'),
  notes: optionalTextSchema,
});

export const mergeFeaturesSchema = z.object({
  workspaceId: cuidSchema,
  canonicalFeatureId: cuidSchema,
  mergedFeatureIds: z.array(cuidSchema).min(1),
  changedById: cuidSchema.optional(),
  notes: optionalTextSchema,
});

export const addFeatureRelationSchema = z.object({
  workspaceId: cuidSchema,
  fromFeatureId: cuidSchema,
  toFeatureId: cuidSchema,
  relationType: relationTypeSchema,
  confidenceScore: z.number().min(0).max(1).optional(),
  evidenceJson: jsonRecordSchema.optional(),
});

export const createCommentSchema = z.object({
  workspaceId: cuidSchema,
  featureId: cuidSchema.optional(),
  reportId: cuidSchema.optional(),
  authorId: cuidSchema,
  parentCommentId: cuidSchema.optional(),
  body: z.string().trim().min(1).max(5000),
  visibility: commentVisibilitySchema.default('WORKSPACE'),
  mentionsJson: z.array(cuidSchema).optional(),
}).refine((data) => Boolean(data.featureId || data.reportId), {
  message: 'A comment must belong to either a feature or a report',
  path: ['featureId'],
});
