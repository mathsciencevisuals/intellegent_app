import { NextRequest } from 'next/server';
import { withApi } from '@/lib/api/response';
import { parseJson } from '@/lib/api/parse';
import { loginSchema } from '@/lib/api/validators';
import { services } from '@/lib/prisma/service-access';

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const input = await parseJson(req, loginSchema);
    return services.workspace.login(input);
  });
}
