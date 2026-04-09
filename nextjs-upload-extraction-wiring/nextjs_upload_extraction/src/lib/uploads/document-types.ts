import { DocumentType } from '@prisma/client';

export function inferDocumentType(fileName: string, mimeType?: string): DocumentType {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (lower.endsWith('.pdf') || mime.includes('pdf')) return DocumentType.PDF;
  if (lower.endsWith('.docx') || mime.includes('wordprocessingml')) return DocumentType.DOCX;
  if (lower.endsWith('.md') || mime.includes('markdown')) return DocumentType.MARKDOWN;
  if (lower.endsWith('.txt') || mime.startsWith('text/plain')) return DocumentType.TXT;
  if (lower.endsWith('.html') || mime.includes('html')) return DocumentType.HTML;

  return DocumentType.TXT;
}
