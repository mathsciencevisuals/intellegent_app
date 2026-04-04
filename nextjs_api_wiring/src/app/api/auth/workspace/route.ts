import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { createWorkspaceSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';
import { getRequestContext } from '@/lib/auth/context';

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const input = await parseJson(req, createWorkspaceSchema);
    const ctx = getRequestContext(req);
    return services.workspace.createWorkspace({ ...input, createdById: ctx.userId });
  }, 201);
}
