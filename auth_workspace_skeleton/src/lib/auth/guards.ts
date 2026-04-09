import { ForbiddenError } from './errors';
import { hasMinimumRole } from './permissions';
import type { RequestContext, WorkspaceRole } from './types';

export function requireRole(ctx: RequestContext, minimumRole: WorkspaceRole) {
  if (!hasMinimumRole(ctx.role, minimumRole)) {
    throw new ForbiddenError(`Requires ${minimumRole} role or above`);
  }
}

export function requireWorkspaceMatch(ctx: RequestContext, workspaceId: string) {
  if (ctx.workspaceId !== workspaceId) {
    throw new ForbiddenError('Workspace mismatch');
  }
}
