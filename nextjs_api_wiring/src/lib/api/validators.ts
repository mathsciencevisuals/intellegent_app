import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).default('STARTER'),
});

export const createSourceSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(['JIRA', 'ADO', 'CONFLUENCE', 'NOTION', 'GOOGLE_DRIVE', 'SHAREPOINT', 'PDF_UPLOAD', 'API']),
  config: z.record(z.string(), z.any()).default({}),
});

export const listSourcesQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
});

export const syncSourceSchema = z.object({
  mode: z.enum(['FULL', 'INCREMENTAL']).default('INCREMENTAL'),
});

export const createPipelineJobSchema = z.object({
  sourceId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  kind: z.enum(['INGEST', 'PARSE', 'EXTRACT', 'DEDUP', 'CLASSIFY']).default('EXTRACT'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
});

export const listJobsQuerySchema = z.object({
  status: z.string().optional(),
  kind: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export const listFeaturesQuerySchema = z.object({
  q: z.string().optional(),
  module: z.string().optional(),
  status: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).default(25),
});

export const approveFeatureSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  note: z.string().max(2000).optional(),
});

export const mergeFeaturesSchema = z.object({
  primaryFeatureId: z.string().min(1),
  duplicateFeatureIds: z.array(z.string().min(1)).min(1),
  note: z.string().max(2000).optional(),
});

export const createReportSchema = z.object({
  name: z.string().min(2).max(140),
  type: z.enum(['COVERAGE', 'DUPLICATES', 'TIMELINE', 'OWNERSHIP', 'GAP_ANALYSIS']),
  filters: z.record(z.string(), z.any()).default({}),
});

export const queryInsightsSchema = z.object({
  query: z.string().min(3).max(1000),
});

export const createSavedViewSchema = z.object({
  name: z.string().min(2).max(140),
  entityType: z.enum(['FEATURE', 'REPORT', 'JOB', 'SOURCE']),
  filters: z.record(z.string(), z.any()).default({}),
});

export const listCommentsQuerySchema = z.object({
  featureId: z.string().optional(),
  documentId: z.string().optional(),
});

export const createCommentSchema = z.object({
  featureId: z.string().optional(),
  documentId: z.string().optional(),
  body: z.string().min(1).max(5000),
}).refine((value) => Boolean(value.featureId || value.documentId), {
  message: 'Either featureId or documentId is required',
});

export const billingCheckoutSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
  interval: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const patchTenantSettingsSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  defaultRole: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
  retentionDays: z.number().int().min(1).max(3650).optional(),
  allowPublicExports: z.boolean().optional(),
});
