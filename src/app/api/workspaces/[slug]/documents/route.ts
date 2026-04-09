import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { processDocumentFile } from "@/lib/documents/process-document";
import { runMockExtractionJob } from "@/lib/features/run-mock-extraction-job";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isAllowedFileType(file: File) {
  return ALLOWED_MIME_TYPES.has(file.type);
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
      select: { id: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const documents = await prisma.document.findMany({
      where: {
        workspaceId: workspace.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/documents failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  let documentId: string | null = null;
  let extractionJobId: string | null = null;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const sourceIdValue = formData.get("sourceId");
    const sourceId =
      typeof sourceIdValue === "string" && sourceIdValue.trim().length > 0
        ? sourceIdValue.trim()
        : null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Empty file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size is 10 MB." },
        { status: 400 }
      );
    }

    if (!isAllowedFileType(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: txt, pdf, doc, docx" },
        { status: 400 }
      );
    }

    if (sourceId) {
      const source = await prisma.source.findFirst({
        where: {
          id: sourceId,
          workspaceId: workspace.id,
        },
        select: {
          id: true,
        },
      });

      if (!source) {
        return NextResponse.json(
          { error: "Selected source does not belong to this workspace" },
          { status: 400 }
        );
      }
    }

    const document = await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        sourceId,
        title: file.name,
        fileName: file.name,
        mimeType: file.type || null,
        fileSize: file.size,
        status: "PROCESSING",
        processingStartedAt: new Date(),
      },
    });

    documentId = document.id;

    const extractionJob = await prisma.extractionJob.create({
      data: {
        workspaceId: workspace.id,
        documentId: document.id,
        status: "QUEUED",
        trigger: "UPLOAD",
        provider: "mock-parser",
        logs: "Upload accepted. Waiting for mock extraction to start.",
      },
      select: {
        id: true,
      },
    });

    extractionJobId = extractionJob.id;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${safeFileName}`;
    const workspaceUploadDir = path.join(process.cwd(), "uploads", workspace.slug);
    const filePath = path.join(workspaceUploadDir, uniqueName);
    const storageKey = path.join("uploads", workspace.slug, uniqueName);

    await mkdir(workspaceUploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    const processed = await processDocumentFile({
      filePath,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
    });

    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        storageKey,
        status: "READY",
        errorMessage: null,
        extractedText: processed.extractedText,
        processingSummary: processed.processingSummary,
        processedAt: new Date(),
      },
    });

    const extractionResult = await runMockExtractionJob({
      jobId: extractionJob.id,
      workspaceId: workspace.id,
      documentId: document.id,
      documentTitle: updatedDocument.title,
      extractedText: updatedDocument.extractedText,
      sourceId,
    });

    return NextResponse.json(
      {
        document: updatedDocument,
        extractionJobId: extractionJob.id,
        createdFeatureCount: extractionResult.createdFeatureCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces/[slug]/documents failed:", error);

    if (documentId) {
      try {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : "Unknown upload error",
          },
        });
      } catch (updateError) {
        console.error("Failed to mark document as FAILED:", updateError);
      }
    }

    if (extractionJobId) {
      try {
        await prisma.extractionJob.update({
          where: { id: extractionJobId },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            logs:
              error instanceof Error
                ? error.message
                : "Unknown extraction failure during upload.",
          },
        });
      } catch (updateError) {
        console.error("Failed to mark extraction job as FAILED:", updateError);
      }
    }

    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
