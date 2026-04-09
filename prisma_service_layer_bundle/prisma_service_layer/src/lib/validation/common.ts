import { z } from 'zod';

export const cuidSchema = z.string().cuid();
export const emailSchema = z.string().email().max(320).transform((v) => v.toLowerCase().trim());
export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only');
export const nameSchema = z.string().min(1).max(200).trim();
export const optionalTextSchema = z.string().trim().max(10000).optional().nullable();
export const jsonRecordSchema = z.record(z.any());
export const positiveIntSchema = z.number().int().positive();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function toPrismaSkipTake(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
