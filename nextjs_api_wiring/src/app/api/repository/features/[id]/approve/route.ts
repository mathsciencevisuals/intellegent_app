import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { approveFeatureSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext, requireRole } from '@/lib/auth/context';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN', 'EDITOR']);
    const input = await parseJson(req, approveFeatureSchema);
    const { id } = await params;
    return services.feature.approve({
      workspaceId: ctx.workspaceId,
      featureId: id,
      reviewerId: ctx.userId,
      ...input,
    });
  });
}
