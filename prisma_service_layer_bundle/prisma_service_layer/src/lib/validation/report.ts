import { z } from 'zod';
import { cuidSchema, jsonRecordSchema, nameSchema, optionalTextSchema, paginationSchema } from './common';
import { reportStatusSchema, reportTypeSchema, savedViewScopeSchema } from './enums';

export const listReportsSchema = paginationSchema.extend({
  workspaceId: cuidSchema,
  type: reportTypeSchema.optional(),
  status: reportStatusSchema.optional(),
});

export const createReportSchema = z.object({
  workspaceId: cuidSchema,
  createdById: cuidSchema.optional(),
  type: reportTypeSchema,
  name: nameSchema,
  description: optionalTextSchema,
  filtersJson: jsonRecordSchema.optional(),
  scheduledCron: z.string().trim().max(120).optional(),
});

export const saveViewSchema = z.object({
  workspaceId: cuidSchema,
  createdById: cuidSchema,
  name: nameSchema,
  description: optionalTextSchema,
  scope: savedViewScopeSchema.default('PRIVATE'),
  filtersJson: jsonRecordSchema,
  columnsJson: jsonRecordSchema.optional(),
  isDefault: z.boolean().optional(),
});
