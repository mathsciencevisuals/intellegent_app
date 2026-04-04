import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError } from '@/lib/api/errors';

export const roleSchema = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);

export type RequestContext = {
  userId: string;
  workspaceId: string;
  role: z.infer<typeof roleSchema>;
  email?: string;
};

export function getRequestContext(req: NextRequest): RequestContext {
  const userId = req.headers.get('x-user-id') || 'user_demo_owner';
  const workspaceId = req.headers.get('x-workspace-id') || 'ws_demo';
  const roleRaw = req.headers.get('x-user-role') || 'OWNER';
  const email = req.headers.get('x-user-email') || 'owner@featureintel.dev';

  const parsedRole = roleSchema.safeParse(roleRaw);
  if (!parsedRole.success) {
    throw new ApiError(401, 'INVALID_ROLE', 'Invalid or missing user role header');
  }

  return {
    userId,
    workspaceId,
    role: parsedRole.data,
    email,
  };
}

export function requireRole(context: RequestContext, roles: RequestContext['role'][]) {
  if (!roles.includes(context.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission for this action');
  }
}
