import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { createReportSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext, requireRole } from '@/lib/auth/context';

export async function GET(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    return services.report.list({ workspaceId: ctx.workspaceId });
  });
}

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN', 'EDITOR']);
    const input = await parseJson(req, createReportSchema);
    return services.report.create({ workspaceId: ctx.workspaceId, createdById: ctx.userId, ...input });
  }, 201);
}
