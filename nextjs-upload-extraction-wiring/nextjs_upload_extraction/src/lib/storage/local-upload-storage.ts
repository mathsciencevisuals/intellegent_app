import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export type StoredUpload = {
  storageKey: string;
  absolutePath: string;
  sizeBytes: number;
  checksumSha256: string;
  mimeType: string;
  originalName: string;
};

const DEFAULT_BASE_DIR = path.join(process.cwd(), '.uploads');

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveUploadedFile(opts: {
  workspaceId: string;
  file: File;
  baseDir?: string;
}): Promise<StoredUpload> {
  const baseDir = opts.baseDir ?? process.env.UPLOAD_BASE_DIR ?? DEFAULT_BASE_DIR;
  const arrayBuffer = await opts.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const checksumSha256 = createHash('sha256').update(buffer).digest('hex');
  const datePrefix = new Date().toISOString().slice(0, 10);
  const safeName = safeFileName(opts.file.name || 'upload.bin');
  const storageKey = path.posix.join(opts.workspaceId, datePrefix, `${checksumSha256}-${safeName}`);
  const absolutePath = path.join(baseDir, storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    storageKey,
    absolutePath,
    sizeBytes: buffer.byteLength,
    checksumSha256,
    mimeType: opts.file.type || 'application/octet-stream',
    originalName: opts.file.name || safeName,
  };
}
