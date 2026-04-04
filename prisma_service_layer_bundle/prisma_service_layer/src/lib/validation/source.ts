import { z } from 'zod';
import { cuidSchema, jsonRecordSchema, nameSchema, optionalTextSchema, paginationSchema, positiveIntSchema } from './common';
import { sourceStatusSchema, sourceTypeSchema } from './enums';

export const listSourcesSchema = paginationSchema.extend({
  workspaceId: cuidSchema,
  type: sourceTypeSchema.optional(),
  status: sourceStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export const createSourceSchema = z.object({
  workspaceId: cuidSchema,
  integrationCredentialId: cuidSchema.optional(),
  type: sourceTypeSchema,
  name: nameSchema,
  externalId: z.string().trim().max(255).optional(),
  syncFrequencyMinutes: positiveIntSchema.max(60 * 24).optional(),
  configJson: jsonRecordSchema.optional(),
});

export const updateSourceSchema = z.object({
  sourceId: cuidSchema,
  workspaceId: cuidSchema,
  name: nameSchema.optional(),
  status: sourceStatusSchema.optional(),
  syncFrequencyMinutes: positiveIntSchema.max(60 * 24).nullable().optional(),
  configJson: jsonRecordSchema.optional(),
  lastError: optionalTextSchema,
});

export const triggerSourceSyncSchema = z.object({
  sourceId: cuidSchema,
  workspaceId: cuidSchema,
  startedById: cuidSchema.optional(),
  metadataJson: jsonRecordSchema.optional(),
});
