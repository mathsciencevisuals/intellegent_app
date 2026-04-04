import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { createPipelineJobSchema, listJobsQuerySchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext, requireRole } from '@/lib/auth/context';

export async function GET(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    const query = listJobsQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    return services.pipeline.listJobs({ workspaceId: ctx.workspaceId, ...query });
  });
}

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN', 'EDITOR']);
    const input = await parseJson(req, createPipelineJobSchema);
    return services.pipeline.createJob({ workspaceId: ctx.workspaceId, createdById: ctx.userId, ...input });
  }, 202);
}
