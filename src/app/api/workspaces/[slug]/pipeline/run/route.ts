import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { runMockExtractionJob } from "@/lib/features/run-mock-extraction-job";
import { getWorkspaceAccess } from "@/lib/workspaces";

const runPipelineSchema = z.object({
  documentId: z.string().min(1).optional(),
  documentIds: z.array(z.string().min(1)).max(20).optional(),
});

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

    const body = await req.json().catch(() => ({}));
    const parsed = runPipelineSchema.parse(body);
    const requestedIds: string[] = Array.from(
      new Set([parsed.documentId, ...(parsed.documentIds ?? [])].filter(Boolean))
    ) as string[];

    const documents = await prisma.document.findMany({
      where: {
        workspaceId: access.workspace.id,
        ...(requestedIds.length > 0 ? { id: { in: requestedIds } } : {}),
        status: {
          not: "PROCESSING",
        },
      },
      select: {
        id: true,
        title: true,
        extractedText: true,
        sourceId: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "No eligible documents found for pipeline run" },
        { status: 400 }
      );
    }

    const jobs = [];

    for (const document of documents) {
      const job = await prisma.extractionJob.create({
        data: {
          workspaceId: access.workspace.id,
          documentId: document.id,
          status: "QUEUED",
          trigger: "MANUAL",
          provider: "mock-parser",
          logs: "Pipeline run requested from the automation opportunity API.",
        },
        select: {
          id: true,
          documentId: true,
          status: true,
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

      jobs.push(job);
    }

    return NextResponse.json(
      {
        jobs,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("POST /api/workspaces/[slug]/pipeline/run failed:", error);
    return NextResponse.json({ error: "Failed to run pipeline" }, { status: 500 });
  }
}
