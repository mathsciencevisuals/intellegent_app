import { auth } from '@/lib/auth';
import { UnauthorizedError } from './errors';
import { resolveActiveWorkspace } from './workspace';
import type { RequestContext } from './types';

export async function getRequestContext(): Promise<RequestContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const membership = await resolveActiveWorkspace(session.user.id);

  return {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    membershipId: membership.id,
    role: membership.role as RequestContext['role'],
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}
