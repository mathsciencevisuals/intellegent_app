# Next.js API route wiring guide

This bundle connects App Router route handlers to the Prisma service layer with:

- consistent JSON success/error envelopes
- request context extraction (`x-user-id`, `x-workspace-id`, `x-user-role`)
- basic role enforcement
- Zod input validation
- service delegation per domain

## Expected existing project pieces

These files assume your project already contains:

- `@/lib/prisma/service-factory`
- the underlying Prisma services (`workspace`, `source`, `pipeline`, `feature`, `report`)
- the hardened Prisma schema
- Next.js app router project setup

## Header-based auth context

Until real auth is wired, the route layer resolves context from headers:

- `x-user-id`
- `x-workspace-id`
- `x-user-role`
- `x-user-email`

Fallback demo values are provided so local development can work quickly.

## Success envelope

```json
{
  "success": true,
  "data": { ... }
}
```

## Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { ... }
  }
}
```

## Service method expectations

These route handlers assume the following methods exist or will be added:

### workspace service
- `login(input)`
- `createWorkspace(input)`
- `createCheckoutSession(input)`
- `getSettings(input)`
- `updateSettings(input)`

### source service
- `list(input)`
- `create(input)`
- `sync(input)`

### pipeline service
- `listJobs(input)`
- `createJob(input)`
- `getJob(input)`

### feature service
- `list(input)`
- `getById(input)`
- `approve(input)`
- `merge(input)`
- `listComments(input)`
- `createComment(input)`

### report service
- `list(input)`
- `create(input)`
- `queryInsights(input)`
- `listSavedViews(input)`
- `createSavedView(input)`

## Recommended immediate follow-up

1. replace header-based auth with your session provider
2. map any mismatched service method names
3. add route tests with seeded DB
4. add upload/document routes next
5. add a background worker for pipeline jobs
