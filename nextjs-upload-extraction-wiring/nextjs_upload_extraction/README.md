# Next.js upload + extraction wiring patch

This folder contains a backend patch for the FeatureIntel Next.js starter.

It wires document upload and extraction job creation end to end with Prisma-backed services and a mock extraction processor.

Copy these files into your app, then ensure these existing files remain in place from the earlier route wiring bundle:

- `src/lib/api/errors.ts`
- `src/lib/api/response.ts`
- `src/lib/auth/context.ts`
- `src/app/api/repository/features/route.ts`
- `src/app/api/repository/features/[id]/route.ts`

See `docs/UPLOAD_EXTRACTION_FLOW.md` for usage.
