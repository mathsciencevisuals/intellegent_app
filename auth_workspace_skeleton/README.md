# Auth + Workspace Session Code Skeleton

This bundle is designed to drop into your Next.js App Router project.

## What it gives you
- Auth.js starter configuration
- server-side request context resolution
- active workspace cookie handling
- role guards
- workspace switch API route
- protected layout pattern
- middleware matcher setup

## Expected existing pieces
- Prisma client at `src/lib/prisma/client.ts`
- Prisma models for `User`, `Membership`, `Workspace`, `AuditLog`
- enum values including membership `status: ACTIVE`

## Install notes
You will likely need:
- `next-auth`
- `zod`
- OAuth provider credentials if using GitHub/Google
- optionally `@auth/prisma-adapter`

## Suggested integration order
1. Copy these files into your app
2. Add PrismaAdapter in `src/lib/auth/config.ts`
3. Confirm your `Membership` and `AuditLog` model names match
4. Add a workspace switcher UI that calls `POST /api/workspaces/active`
5. Replace temporary route auth with `getRequestContext()`
6. Add role checks in write/admin routes

## Important design rule
Identity is authenticated by Auth.js.
Workspace access is verified on every request through Prisma.
Never trust the workspace cookie by itself.
