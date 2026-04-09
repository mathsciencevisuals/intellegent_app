import { NextResponse } from 'next/server';
import { ForbiddenError, UnauthorizedError, WorkspaceNotFoundError } from './errors';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }

  if (error instanceof WorkspaceNotFoundError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
