export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export interface RequestContext {
  userId: string;
  workspaceId: string;
  membershipId: string;
  role: WorkspaceRole;
  user: SessionUser;
}
