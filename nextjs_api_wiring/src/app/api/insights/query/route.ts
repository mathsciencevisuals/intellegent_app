import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { queryInsightsSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext } from '@/lib/auth/context';

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    const input = await parseJson(req, queryInsightsSchema);
    return services.report.queryInsights({ workspaceId: ctx.workspaceId, userId: ctx.userId, ...input });
  });
}
