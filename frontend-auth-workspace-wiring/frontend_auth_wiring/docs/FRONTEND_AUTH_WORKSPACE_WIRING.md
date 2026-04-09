# Frontend wiring for real auth/session and active workspace state

This bundle wires the UI to the auth/session architecture instead of relying on mock-only navigation.

## What it adds
- root `SessionProvider`
- protected layout that resolves request context and workspace summary server-side
- workspace switcher client component calling `POST /api/workspaces/active`
- authenticated shell with sign-out action
- auth page tied to Auth.js session state
- example protected pages for dashboard, sources, and repository

## Integration order
1. Copy these files into your Next.js project.
2. Keep the previously generated auth/session skeleton in place.
3. Make sure your import aliases use `@/` pointing to `src/`.
4. Merge the `AppShell` with your existing dashboard shell if you already have one.
5. Update `/dashboard`, `/sources`, `/repository`, and other protected pages to fetch real API data with the server-side request context.

## Important behavior
- The protected layout verifies session + membership on every request.
- The workspace switcher updates the active workspace cookie and triggers `router.refresh()`.
- The server remains the source of truth; the client switcher only changes the hint cookie.

## Recommended next step
Wire repository, sources, and pipeline pages to their live APIs using the authenticated workspace context.
