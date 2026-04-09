import { NextRequest } from 'next/server';
import { ZodType } from 'zod';

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}
