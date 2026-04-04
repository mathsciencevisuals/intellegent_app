# Next.js API route wiring bundle

Copy `src/**` into your Next.js project.

## Added files

- `src/app/api/**/route.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/response.ts`
- `src/lib/api/parse.ts`
- `src/lib/api/query.ts`
- `src/lib/api/validators.ts`
- `src/lib/auth/context.ts`
- `src/lib/prisma/service-access.ts`

## Notes

- This is a route-layer bundle, not a full project snapshot.
- It is designed to sit on top of the Prisma service layer already generated.
- Replace the temporary header-based request context with real auth as soon as you wire Auth.js, Clerk, or Supabase Auth.
