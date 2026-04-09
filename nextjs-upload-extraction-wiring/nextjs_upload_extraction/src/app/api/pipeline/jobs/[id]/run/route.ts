import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { ApiError } from '@/lib/api/errors';
import { getRequestContext, requireRole } from '@/lib/auth/context';
import { services } from '@/lib/prisma/service-factory';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN', 'EDITOR']);
    const { id } = await params;
    const result = await services.pipeline.runExtractionJob({ workspaceId: ctx.workspaceId, jobId: id });
    if (!result) {
      throw new ApiError(404, 'JOB_NOT_FOUND', 'Extraction job not found');
    }
    return result;
  });
}
