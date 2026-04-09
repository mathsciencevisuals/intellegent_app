# Zod validators and Prisma service layer

This package is intended to be copied into your Next.js project, typically under:

- `src/lib/validation/*`
- `src/lib/prisma/*`

## What is included

- Zod validators for the main write and list flows
- Prisma client singleton
- App error types
- Workspace membership and role guards
- Audit-log helper
- Domain services for:
  - workspaces
  - sources
  - documents
  - extraction jobs
  - features
  - reports / saved views

## Important implementation note

The schema is multi-tenant, but Prisma does **not** fully enforce tenant consistency across every relation.
These services therefore include explicit `workspaceId` checks before updates on critical entities.
You should keep that pattern on every write path.

## Example usage in a route handler

```ts
import { NextRequest, NextResponse } from 'next/server';
import { services } from '@/lib/prisma/service-factory';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await services.feature.create(body);
  return NextResponse.json(result, { status: 201 });
}
```

## Recommended next additions

- add `z.safeParse` + consistent API error formatting
- add user-context-driven authorization helpers
- add background queue adapters for pipeline jobs
- add repository search with full-text or vector lookup
- add integration-specific source sync adapters

## One schema caveat to fix soon

`Approval` does not have a natural unique constraint for `(featureId, reviewerId)`.
The sample service currently uses a synthetic ID for upsert convenience.
A better schema change is:

```prisma
model Approval {
  // ...
  @@unique([featureId, reviewerId])
}
```

Then update the service to upsert on that compound key instead.
