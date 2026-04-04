import type { WorkspaceRole } from './types';

export const ROLE_WEIGHT: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function hasMinimumRole(role: WorkspaceRole, required: WorkspaceRole): boolean {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[required];
}

export function canWrite(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, 'EDITOR');
}

export function canAdminWorkspace(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, 'ADMIN');
}
