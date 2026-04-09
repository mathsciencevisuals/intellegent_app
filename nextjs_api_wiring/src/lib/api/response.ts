import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, isApiError } from './errors';

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json<ApiFailure>(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (isApiError(error)) {
    return NextResponse.json<ApiFailure>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error',
      },
    },
    { status: 500 },
  );
}

export async function withApi<T>(handler: () => Promise<T>, successStatus = 200) {
  try {
    const data = await handler();
    return ok(data, successStatus);
  } catch (error) {
    return fail(error);
  }
}

export function assertPresent<T>(value: T | null | undefined, message: string, code = 'NOT_FOUND'): T {
  if (value == null) {
    throw new ApiError(404, code, message);
  }
  return value;
}
