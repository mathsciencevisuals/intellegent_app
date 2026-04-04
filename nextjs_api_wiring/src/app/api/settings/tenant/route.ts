import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { patchTenantSettingsSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext, requireRole } from '@/lib/auth/context';

export async function GET(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    return services.workspace.getSettings({ workspaceId: ctx.workspaceId });
  });
}

export async function PATCH(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN']);
    const input = await parseJson(req, patchTenantSettingsSchema);
    return services.workspace.updateSettings({ workspaceId: ctx.workspaceId, actorId: ctx.userId, ...input });
  });
}
