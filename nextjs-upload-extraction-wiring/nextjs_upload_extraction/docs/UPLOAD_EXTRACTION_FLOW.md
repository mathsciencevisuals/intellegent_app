# Upload + extraction flow

This patch wires a real vertical slice for manual uploads:

1. `POST /api/uploads/documents` receives `multipart/form-data`
2. file is stored with a local storage adapter
3. a `Document` row is created in Prisma
4. an `ExtractionJob` row is created in Prisma
5. the route can immediately process the job with a mock extraction worker
6. extracted `Feature` rows + `FeatureVersion` + `FeatureSource` rows are written
7. `/api/repository/features` can now return the created features

## Request

Use `multipart/form-data` with:

- `file` (required)
- `sourceId` (optional)
- `title` (optional)
- `runExtractionNow` = `true|false` (optional, default true in route)
- `rawTextOverride` (optional)

Example with curl:

```bash
curl -X POST http://localhost:3000/api/uploads/documents \
  -H "x-user-id: user_demo_owner" \
  -H "x-workspace-id: ws_demo" \
  -H "x-user-role: OWNER" \
  -F "file=@./sample-prd.md" \
  -F "title=Sample PRD" \
  -F "runExtractionNow=true" \
  -F "rawTextOverride=Users need approval workflow, billing export, and audit traceability"
```

## Response shape

```json
{
  "success": true,
  "data": {
    "document": { "id": "..." },
    "job": { "id": "..." },
    "processing": {
      "jobId": "...",
      "createdFeatureIds": ["..."],
      "createdCount": 3
    }
  }
}
```

## Files included

- `src/app/api/uploads/documents/route.ts`
- `src/app/api/pipeline/jobs/[id]/run/route.ts`
- `src/lib/storage/local-upload-storage.ts`
- `src/lib/uploads/document-types.ts`
- `src/lib/uploads/mock-extraction.ts`
- `src/lib/prisma/client.ts`
- `src/lib/prisma/service-factory.ts`

## Important assumptions

- Uses your hardened Prisma models: `Source`, `Document`, `ExtractionJob`, `Feature`, `FeatureVersion`, `FeatureSource`
- Uses local disk storage for MVP (`.uploads/` under project root unless `UPLOAD_BASE_DIR` is set)
- Uses a mock extraction worker for now; replace `processExtractionJob()` with your LLM pipeline later
- Keeps auth temporary via request headers already used in your route layer

## Recommended next step

After this patch, wire the frontend upload screen to `POST /api/uploads/documents`, then poll `GET /api/pipeline/jobs/:id` or call `POST /api/pipeline/jobs/:id/run` when you want manual processing control.
