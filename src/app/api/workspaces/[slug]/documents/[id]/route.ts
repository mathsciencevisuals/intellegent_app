import { unlink } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { processDocumentFile } from "@/lib/documents/process-document";
import { runMockExtractionJob } from "@/lib/features/run-mock-extraction-job";

type RouteContext = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

const updateDocumentSchema = z.object({
  action: z.literal("reprocess"),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  let extractionJobId: string | null = null;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await context.params;
    const body = await req.json();
    const parsed = updateDocumentSchema.parse(body);

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

    const document = await prisma.document.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (parsed.action !== "reprocess") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    if (!document.storageKey) {
      return NextResponse.json(
        { error: "Document file is not available for reprocessing" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), document.storageKey);

    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: "PROCESSING",
        errorMessage: null,
        processingStartedAt: new Date(),
      },
    });

    const extractionJob = await prisma.extractionJob.create({
      data: {
        workspaceId: workspace.id,
        documentId: document.id,
        status: "QUEUED",
        trigger: "REPROCESS",
        provider: "mock-parser",
        logs: "Document reprocess requested.",
      },
      select: {
        id: true,
      },
    });

    extractionJobId = extractionJob.id;

    const processed = await processDocumentFile({
      filePath,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
    });

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: "READY",
        errorMessage: null,
        extractedText: processed.extractedText,
        processingSummary: processed.processingSummary,
        processedAt: new Date(),
      },
    });

    await runMockExtractionJob({
      jobId: extractionJob.id,
      workspaceId: workspace.id,
      documentId: document.id,
      documentTitle: updated.title,
      extractedText: updated.extractedText,
      sourceId: document.sourceId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    console.error("PATCH document failed:", error);

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
                : "Unknown reprocessing failure.",
          },
        });
      } catch (updateError) {
        console.error("Failed to mark reprocess job as FAILED:", updateError);
      }
    }

    return NextResponse.json(
      { error: "Failed to reprocess document" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.storageKey) {
      const absolutePath = path.join(process.cwd(), document.storageKey);
      try {
        await unlink(absolutePath);
      } catch (fileError) {
        console.warn("Could not delete file from disk:", fileError);
      }
    }

    await prisma.document.delete({
      where: { id: document.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE document failed:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
