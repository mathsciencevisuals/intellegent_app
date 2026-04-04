import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { listFeaturesQuerySchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext } from '@/lib/auth/context';

export async function GET(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    const query = listFeaturesQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    return services.feature.list({ workspaceId: ctx.workspaceId, ...query });
  });
}
