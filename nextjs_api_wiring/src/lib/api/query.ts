import { NextRequest } from 'next/server';

export function getSearchParams(req: NextRequest) {
  return req.nextUrl.searchParams;
}

export function getOptionalInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
