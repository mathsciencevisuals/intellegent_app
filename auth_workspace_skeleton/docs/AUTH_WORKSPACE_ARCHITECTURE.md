# Auth + Workspace Session Architecture

This design separates **identity** from **tenant context**.

## Goals
- Authenticate the user once
- Resolve the user's active workspace on every request
- Enforce tenant isolation in middleware and service code
- Make workspace switching explicit and auditable
- Keep API handlers simple by exposing a single request context helper

## Core Concepts

### 1. Identity session
Use Auth.js to create the user session. The authenticated session should contain:
- `user.id`
- `user.email`
- `user.name`

Do **not** trust workspace information stored long-term inside the auth JWT/session without re-checking membership.

### 2. Active workspace context
Track the currently selected workspace separately from the auth session.
Recommended storage:
- secure HTTP-only cookie: `active_workspace_id`

This cookie is only a hint. Every request must still verify:
- the workspace exists
- the user has a membership in that workspace
- the membership is active

### 3. Request context
Every server route should resolve a normalized request context:
- `userId`
- `workspaceId`
- `role`
- `membershipId`

This becomes the only input that downstream Prisma services trust.

### 4. Role model
Suggested roles:
- `OWNER`
- `ADMIN`
- `EDITOR`
- `VIEWER`

Use `OWNER | ADMIN | EDITOR` for write actions.
Use `OWNER | ADMIN` for workspace administration, billing, and membership management.

## Request Lifecycle
1. Middleware checks whether the route is protected.
2. Auth.js resolves the logged-in user.
3. Workspace resolver reads `active_workspace_id` cookie.
4. Membership is looked up in Prisma for `(userId, workspaceId)`.
5. If the cookie is missing or invalid, fallback to the user's default or first workspace.
6. API handler receives a typed request context.
7. Service layer uses `workspaceId` in all reads and writes.

## Recommended Route Boundaries

### Public routes
- `/`
- `/pricing`
- `/auth/*`

### Protected routes
- `/dashboard`
- `/sources`
- `/pipeline`
- `/repository`
- `/reports`
- `/settings`
- `/billing`

### Protected API routes
All app API routes except public auth callbacks.

## Workspace Switching Flow
1. User clicks workspace switcher.
2. Frontend calls `POST /api/workspaces/active` with `{ workspaceId }`.
3. Server verifies membership.
4. Server sets `active_workspace_id` cookie.
5. UI refreshes and subsequent requests use the new context.

## Security Rules
- Never trust workspace IDs coming from the client without membership verification.
- Every Prisma query for tenant data must scope by `workspaceId`.
- Log workspace switching and admin actions in audit logs.
- Keep auth session and tenant context separate.
- Avoid embedding broad authorization logic in components. Keep it in server guards.

## Recommended Environment Variables
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if using OAuth
- `GITHUB_ID` / `GITHUB_SECRET` if using GitHub OAuth

## Good Next Steps After This Skeleton
1. Connect the files below into your Next.js starter
2. Integrate Auth.js provider(s)
3. Map Prisma models to the adapter
4. Add workspace switcher UI
5. Replace any temporary header-based auth with `getRequestContext()`
6. Add Playwright tests for login, workspace switch, and tenant isolation
