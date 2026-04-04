import { ExtractionJobStatus, FeatureStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

function deriveFeatureCandidates(text: string, title: string) {
  const base = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .slice(0, 5);

  if (base.length === 0) {
    base.push(`Feature extracted from ${title}`);
  }

  return base.map((line, index) => {
    const short = line.slice(0, 96);
    const featureTitle = short.length < 16 ? `${title} capability ${index + 1}` : short;
    return {
      title: featureTitle,
      summary: `Auto-extracted from ${title}`,
      description: line,
      module: index % 2 === 0 ? 'Core Platform' : 'Workflow',
      productArea: index % 2 === 0 ? 'Repository' : 'Insights',
      confidenceScore: Math.max(0.62, 0.9 - index * 0.05),
    };
  });
}

export async function processExtractionJob(jobId: string) {
  const job = await prisma.extractionJob.findUnique({
    where: { id: jobId },
    include: {
      document: true,
    },
  });

  if (!job) {
    throw new Error(`Extraction job not found: ${jobId}`);
  }

  if (!job.documentId || !job.document) {
    throw new Error(`Extraction job ${jobId} has no linked document`);
  }

  await prisma.extractionJob.update({
    where: { id: jobId },
    data: {
      status: ExtractionJobStatus.RUNNING,
      startedAt: new Date(),
      progressPct: 20,
      attemptCount: { increment: 1 },
    },
  });

  const rawText = job.document.rawText || job.document.title;
  const candidates = deriveFeatureCandidates(rawText, job.document.title);

  const createdIds: string[] = [];

  for (const candidate of candidates) {
    const created = await prisma.feature.create({
      data: {
        workspaceId: job.workspaceId,
        createdById: job.startedById,
        updatedById: job.startedById,
        status: FeatureStatus.CANDIDATE,
        title: candidate.title,
        slug: `${slugify(candidate.title)}-${job.documentId!.slice(-6)}`,
        summary: candidate.summary,
        description: candidate.description,
        module: candidate.module,
        productArea: candidate.productArea,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        confidenceScore: candidate.confidenceScore,
        metadataJson: {
          extractionJobId: job.id,
          extractionMode: 'mock',
        } satisfies Prisma.JsonObject,
        versions: {
          create: {
            workspaceId: job.workspaceId,
            changedById: job.startedById,
            versionNumber: 1,
            title: candidate.title,
            summary: candidate.summary,
            description: candidate.description,
            status: FeatureStatus.CANDIDATE,
            confidenceScore: candidate.confidenceScore,
            snapshotJson: {
              title: candidate.title,
              summary: candidate.summary,
              description: candidate.description,
            } satisfies Prisma.JsonObject,
          },
        },
        sources: {
          create: {
            workspaceId: job.workspaceId,
            documentId: job.documentId,
            isPrimary: true,
            confidenceScore: candidate.confidenceScore,
            sourceExcerpt: candidate.description?.slice(0, 400),
            sourceLocation: 'mock:line-derived',
          },
        },
      },
    });

    createdIds.push(created.id);
  }

  await prisma.document.update({
    where: { id: job.documentId },
    data: {
      status: 'EXTRACTED',
      extractedAt: new Date(),
    },
  });

  await prisma.extractionJob.update({
    where: { id: jobId },
    data: {
      status: ExtractionJobStatus.SUCCEEDED,
      finishedAt: new Date(),
      progressPct: 100,
      outputJson: {
        createdFeatureIds: createdIds,
        createdCount: createdIds.length,
      } satisfies Prisma.JsonObject,
      metricsJson: {
        mockExtraction: true,
        createdCount: createdIds.length,
      } satisfies Prisma.JsonObject,
    },
  });

  return {
    jobId,
    createdFeatureIds: createdIds,
    createdCount: createdIds.length,
  };
}
