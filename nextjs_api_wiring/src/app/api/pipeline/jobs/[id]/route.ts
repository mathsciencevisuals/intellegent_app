import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext } from '@/lib/auth/context';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    const { id } = await params;
    return services.pipeline.getJob({ workspaceId: ctx.workspaceId, jobId: id });
  });
}
