import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { runMockExtractionJob } from "@/lib/features/run-mock-extraction-job";
import { getWorkspaceAccess } from "@/lib/workspaces";

const createExtractionJobSchema = z.object({
  documentId: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const jobs = await prisma.extractionJob.findMany({
      where: {
        workspaceId: access.workspace.id,
      },
      select: {
        id: true,
        workspaceId: true,
        documentId: true,
        status: true,
        trigger: true,
        provider: true,
        logs: true,
        featureCount: true,
        confidenceAvg: true,
        providerUsed: true,
        modelUsed: true,
        promptVersionUsed: true,
        temperatureUsed: true,
        maxTokensUsed: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
        document: {
          select: {
            id: true,
            title: true,
            status: true,
            source: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/extraction-jobs failed:", error);
    return NextResponse.json({ error: "Failed to fetch extraction jobs" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createExtractionJobSchema.parse(body);

    const document = await prisma.document.findFirst({
      where: {
        id: parsed.documentId,
        workspaceId: access.workspace.id,
      },
      select: {
        id: true,
        title: true,
        extractedText: true,
        sourceId: true,
        status: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status === "PROCESSING") {
      return NextResponse.json(
        { error: "Document is still processing. Try again when parsing completes." },
        { status: 400 }
      );
    }

    const job = await prisma.extractionJob.create({
      data: {
        workspaceId: access.workspace.id,
        documentId: document.id,
        status: "QUEUED",
        trigger: "MANUAL",
        provider: "mock-parser",
        logs: "Manual extraction requested from the pipeline screen.",
      },
    });

    await runMockExtractionJob({
      jobId: job.id,
      workspaceId: access.workspace.id,
      documentId: document.id,
      documentTitle: document.title,
      extractedText: document.extractedText,
      sourceId: document.sourceId,
    });

    const updatedJob = await prisma.extractionJob.findUnique({
      where: {
        id: job.id,
      },
      select: {
        id: true,
        workspaceId: true,
        documentId: true,
        status: true,
        trigger: true,
        provider: true,
        logs: true,
        featureCount: true,
        confidenceAvg: true,
        providerUsed: true,
        modelUsed: true,
        promptVersionUsed: true,
        temperatureUsed: true,
        maxTokensUsed: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
        document: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ job: updatedJob }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("POST /api/workspaces/[slug]/extraction-jobs failed:", error);
    return NextResponse.json({ error: "Failed to create extraction job" }, { status: 500 });
  }
}
