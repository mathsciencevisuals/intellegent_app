import { z } from 'zod';
import { cuidSchema, jsonRecordSchema, paginationSchema } from './common';
import { extractionJobStatusSchema, extractionJobTypeSchema } from './enums';

export const listJobsSchema = paginationSchema.extend({
  workspaceId: cuidSchema,
  documentId: cuidSchema.optional(),
  type: extractionJobTypeSchema.optional(),
  status: extractionJobStatusSchema.optional(),
});

export const createJobSchema = z.object({
  workspaceId: cuidSchema,
  documentId: cuidSchema.optional(),
  startedById: cuidSchema.optional(),
  type: extractionJobTypeSchema,
  queueName: z.string().trim().max(120).optional(),
  priority: z.number().int().min(1).max(100).default(50),
  inputJson: jsonRecordSchema.optional(),
});

export const updateJobProgressSchema = z.object({
  workspaceId: cuidSchema,
  jobId: cuidSchema,
  progressPct: z.number().int().min(0).max(100),
  status: extractionJobStatusSchema.optional(),
  metricsJson: jsonRecordSchema.optional(),
  outputJson: jsonRecordSchema.optional(),
  errorMessage: z.string().trim().max(5000).optional().nullable(),
});
