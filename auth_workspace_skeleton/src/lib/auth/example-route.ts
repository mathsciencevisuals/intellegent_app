import { getRequestContext } from './session';
import { requireRole } from './guards';
import { ok, fail } from './api';

/**
 * Example pattern for any route handler.
 */
export async function exampleProtectedWriteRoute() {
  try {
    const ctx = await getRequestContext();
    requireRole(ctx, 'EDITOR');

    return ok({
      message: 'Write is allowed in current workspace',
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    });
  } catch (error) {
    return fail(error);
  }
}
