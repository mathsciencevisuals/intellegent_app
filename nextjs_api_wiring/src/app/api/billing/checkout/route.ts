import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { billingCheckoutSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext, requireRole } from '@/lib/auth/context';

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN']);
    const input = await parseJson(req, billingCheckoutSchema);
    return services.workspace.createCheckoutSession({ workspaceId: ctx.workspaceId, actorId: ctx.userId, ...input });
  });
}
