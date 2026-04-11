import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildDocumentAnalysisFromPipeline } from "@/lib/document-analysis";
import { PipelineOrchestrator } from "@/lib/pipeline/pipeline-orchestrator";
import { resolveWorkspaceAiRuntime } from "@/lib/ai-config/workspace-ai-config";

function isMissingExtractionJobColumnError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    /ExtractionJob\.(providerUsed|modelUsed|promptVersionUsed|temperatureUsed|maxTokensUsed).*does not exist/i.test(
      error.message
    )
  );
}

export async function runMockExtractionJob(input: {
  jobId: string;
  workspaceId: string;
  documentId: string;
  documentTitle: string;
  extractedText: string | null;
  sourceId?: string | null;
}) {
  const orchestrator = new PipelineOrchestrator();
  const aiRuntime = await resolveWorkspaceAiRuntime(
    input.workspaceId,
    "featureExtraction"
  );

  try {
    await prisma.extractionJob.update({
      where: { id: input.jobId },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        providerUsed: aiRuntime.provider,
        modelUsed: aiRuntime.model,
        promptVersionUsed: aiRuntime.promptVersion,
        temperatureUsed: aiRuntime.temperature,
        maxTokensUsed: aiRuntime.maxTokens,
        logs: "Mock extraction started from parsed document text.",
      },
    });
  } catch (error) {
    if (!isMissingExtractionJobColumnError(error)) {
      throw error;
    }

    await prisma.extractionJob.update({
      where: { id: input.jobId },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        logs: "Mock extraction started from parsed document text.",
      },
    });
  }

  const candidates = orchestrator.buildFeatureSeeds({
    documentTitle: input.documentTitle,
    extractedText: input.extractedText,
  });

  const previousLinks = await prisma.featureSource.findMany({
    where: {
      documentId: input.documentId,
    },
    select: {
      id: true,
      featureId: true,
    },
  });

  const previousFeatureIds = Array.from(
    new Set(previousLinks.map((item) => item.featureId))
  );

  if (previousLinks.length > 0) {
    await prisma.featureSource.deleteMany({
      where: {
        documentId: input.documentId,
      },
    });

    if (previousFeatureIds.length > 0) {
      const orphanedFeatures = await prisma.feature.findMany({
        where: {
          id: {
            in: previousFeatureIds,
          },
          sources: {
            none: {},
          },
        },
        select: {
          id: true,
        },
      });

      if (orphanedFeatures.length > 0) {
        await prisma.feature.deleteMany({
          where: {
            id: {
              in: orphanedFeatures.map((item) => item.id),
            },
          },
        });
      }
    }
  }

  const createdFeatures = await orchestrator.persistFeatures(candidates, {
    workspaceId: input.workspaceId,
    documentId: input.documentId,
    sourceId: input.sourceId,
  });
  const output = orchestrator.buildOutput(createdFeatures);
  const documentAnalysis = buildDocumentAnalysisFromPipeline(input.documentTitle, output);
  const analyticsPersisted = await orchestrator.persistAnalytics({
    extractionJobId: input.jobId,
    workspaceId: input.workspaceId,
    output,
  });

  const confidenceAvg =
    createdFeatures.length > 0
      ? Math.round(
          createdFeatures.reduce((sum, item) => sum + item.confidenceScore, 0) /
            createdFeatures.length
        )
      : null;

  await prisma.document.update({
    where: { id: input.documentId },
    data: {
      analysisStatus: "done",
      analysisResult: documentAnalysis.analysisResult as object,
      roadmapResult: documentAnalysis.roadmapResult as object,
    },
  });

  await prisma.extractionJob.update({
    where: { id: input.jobId },
    data: {
      status: "COMPLETED",
      featureCount: createdFeatures.length,
      confidenceAvg,
      completedAt: new Date(),
      logs: analyticsPersisted
        ? `Mock extraction completed. Created ${createdFeatures.length} feature candidate${
            createdFeatures.length === 1 ? "" : "s"
          }, ${output.opportunities.length} capability assessment${
            output.opportunities.length === 1 ? "" : "s"
          }, and ${output.opportunities.length} roadmap recommendation${
            output.opportunities.length === 1 ? "" : "s"
          }.`
        : `Mock extraction completed. Created ${createdFeatures.length} feature candidate${
            createdFeatures.length === 1 ? "" : "s"
          }. Analytics tables are missing, so capability dashboards were skipped.`,
    },
  });

  return {
    createdFeatureCount: createdFeatures.length,
    confidenceAvg,
    documentAnalysis,
  };
}
