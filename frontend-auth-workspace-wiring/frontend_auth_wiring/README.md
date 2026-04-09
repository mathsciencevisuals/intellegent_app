# Frontend Auth + Workspace Wiring Bundle

This package is meant to be applied after the Auth.js + workspace session skeleton.

## Included
- `src/app/layout.tsx`
- `src/app/auth/page.tsx`
- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/(protected)/sources/page.tsx`
- `src/app/(protected)/repository/page.tsx`
- `src/components/providers/session-provider.tsx`
- `src/components/auth/sign-in-card.tsx`
- `src/components/app/app-shell.tsx`
- `src/components/app/workspace-switcher.tsx`
- `src/hooks/use-active-workspace.ts`
- docs

## Assumptions
- You already copied the auth workspace skeleton.
- `src/lib/auth/index.ts` exports `auth`.
- `src/lib/auth/server-actions.ts` exports sign-in and sign-out server actions.
- `src/lib/auth/session.ts` and `src/lib/auth/current-workspace.ts` work with Prisma.
