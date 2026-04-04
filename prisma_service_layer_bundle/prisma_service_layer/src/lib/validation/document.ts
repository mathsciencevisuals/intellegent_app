import { z } from 'zod';
import { cuidSchema, jsonRecordSchema, nameSchema, optionalTextSchema, paginationSchema } from './common';
import { documentStatusSchema, documentTypeSchema } from './enums';

export const listDocumentsSchema = paginationSchema.extend({
  workspaceId: cuidSchema,
  sourceId: cuidSchema.optional(),
  status: documentStatusSchema.optional(),
  type: documentTypeSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export const createDocumentSchema = z.object({
  workspaceId: cuidSchema,
  sourceId: cuidSchema.optional(),
  uploadedById: cuidSchema.optional(),
  type: documentTypeSchema,
  title: nameSchema,
  externalId: z.string().trim().max(255).optional(),
  externalUrl: z.string().url().max(2000).optional(),
  storageKey: z.string().trim().max(500).optional(),
  mimeType: z.string().trim().max(200).optional(),
  checksum: z.string().trim().max(255).optional(),
  language: z.string().trim().max(20).optional(),
  pageCount: z.number().int().min(0).optional(),
  tokenCount: z.number().int().min(0).optional(),
  metadataJson: jsonRecordSchema.optional(),
  rawText: optionalTextSchema,
});

export const updateDocumentStatusSchema = z.object({
  workspaceId: cuidSchema,
  documentId: cuidSchema,
  status: documentStatusSchema,
  extractedAt: z.coerce.date().optional().nullable(),
});
