import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { createSourceSchema, listSourcesQuerySchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext, requireRole } from '@/lib/auth/context';

export async function GET(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    const query = listSourcesQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    return services.source.list({ workspaceId: ctx.workspaceId, ...query });
  });
}

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN', 'EDITOR']);
    const input = await parseJson(req, createSourceSchema);
    return services.source.create({ workspaceId: ctx.workspaceId, createdById: ctx.userId, ...input });
  }, 201);
}
