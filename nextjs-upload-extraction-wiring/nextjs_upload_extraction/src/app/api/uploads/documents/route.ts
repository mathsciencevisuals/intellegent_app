import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApi } from '@/lib/api/response';
import { ApiError } from '@/lib/api/errors';
import { getRequestContext, requireRole } from '@/lib/auth/context';
import { saveUploadedFile } from '@/lib/storage/local-upload-storage';
import { services } from '@/lib/prisma/service-factory';

const uploadOptionsSchema = z.object({
  sourceId: z.string().min(1).optional(),
  title: z.string().min(1).max(240).optional(),
  runExtractionNow: z.boolean().optional(),
  rawTextOverride: z.string().max(200000).optional(),
});

export async function POST(req: NextRequest) {
  return withApi(async () => {
    const ctx = getRequestContext(req);
    requireRole(ctx, ['OWNER', 'ADMIN', 'EDITOR']);

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new ApiError(400, 'FILE_REQUIRED', 'A file field is required in multipart/form-data');
    }

    const parsed = uploadOptionsSchema.parse({
      sourceId: formData.get('sourceId')?.toString() || undefined,
      title: formData.get('title')?.toString() || undefined,
      runExtractionNow: formData.get('runExtractionNow')?.toString() === 'true',
      rawTextOverride: formData.get('rawTextOverride')?.toString() || undefined,
    });

    const uploadSource = parsed.sourceId
      ? { id: parsed.sourceId }
      : await services.source.ensureUploadSource({ workspaceId: ctx.workspaceId, createdById: ctx.userId });

    const stored = await saveUploadedFile({
      workspaceId: ctx.workspaceId,
      file,
    });

    const document = await services.document.createUploadedDocument({
      workspaceId: ctx.workspaceId,
      uploadedById: ctx.userId,
      sourceId: uploadSource.id,
      title: parsed.title || stored.originalName,
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      checksum: stored.checksumSha256,
      sizeBytes: stored.sizeBytes,
      rawText: parsed.rawTextOverride,
      metadata: {
        originalName: stored.originalName,
        absolutePath: stored.absolutePath,
      },
    });

    const job = await services.pipeline.createJob({
      workspaceId: ctx.workspaceId,
      createdById: ctx.userId,
      sourceId: uploadSource.id,
      documentId: document.id,
      kind: 'EXTRACT',
      priority: 'NORMAL',
      input: {
        trigger: 'upload',
      },
    });

    const runNow = parsed.runExtractionNow ?? true;
    const result = runNow ? await services.pipeline.runExtractionJob({ workspaceId: ctx.workspaceId, jobId: job.id }) : null;

    return {
      document,
      job,
      processing: runNow ? result : { queued: true },
    };
  }, 201);
}
