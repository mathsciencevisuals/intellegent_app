import { z } from 'zod';
import { cuidSchema, nameSchema, slugSchema } from './common';
import { membershipRoleSchema } from './enums';

export const createWorkspaceSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  primaryDomain: z.string().trim().toLowerCase().max(255).optional(),
  timezone: z.string().trim().max(100).default('UTC'),
  locale: z.string().trim().max(20).default('en'),
  ownerUserId: cuidSchema,
});

export const inviteMemberSchema = z.object({
  workspaceId: cuidSchema,
  email: z.string().email(),
  role: membershipRoleSchema,
  invitedById: cuidSchema,
  title: z.string().max(200).optional(),
});
