-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL_UPLOAD', 'JIRA', 'AZURE_DEVOPS', 'CONFLUENCE', 'NOTION', 'SHAREPOINT');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'NEEDS_ATTENTION', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SyncFrequency" AS ENUM ('MANUAL', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "SourceSyncStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExtractionJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExtractionTrigger" AS ENUM ('UPLOAD', 'REPROCESS', 'MANUAL');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('CANDIDATE', 'APPROVED', 'MERGED');

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "status" "SourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "syncFrequency" "SyncFrequency" NOT NULL DEFAULT 'MANUAL',
    "connectionNotes" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceSync" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "SourceSyncStatus" NOT NULL DEFAULT 'QUEUED',
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "ExtractionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "trigger" "ExtractionTrigger" NOT NULL DEFAULT 'UPLOAD',
    "provider" TEXT,
    "logs" TEXT,
    "featureCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceAvg" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module" TEXT,
    "description" TEXT,
    "status" "FeatureStatus" NOT NULL DEFAULT 'CANDIDATE',
    "tags" TEXT[],
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "owner" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureSource" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sourceId" TEXT,
    "excerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Source_workspaceId_type_idx" ON "Source"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "SourceSync_workspaceId_createdAt_idx" ON "SourceSync"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "SourceSync_sourceId_createdAt_idx" ON "SourceSync"("sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ExtractionJob_workspaceId_createdAt_idx" ON "ExtractionJob"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ExtractionJob_documentId_createdAt_idx" ON "ExtractionJob"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "Feature_workspaceId_status_idx" ON "Feature"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Feature_workspaceId_confidenceScore_idx" ON "Feature"("workspaceId", "confidenceScore");

-- CreateIndex
CREATE INDEX "FeatureSource_featureId_idx" ON "FeatureSource"("featureId");

-- CreateIndex
CREATE INDEX "FeatureSource_documentId_idx" ON "FeatureSource"("documentId");

-- CreateIndex
CREATE INDEX "FeatureSource_sourceId_idx" ON "FeatureSource"("sourceId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSync" ADD CONSTRAINT "SourceSync_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSync" ADD CONSTRAINT "SourceSync_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureSource" ADD CONSTRAINT "FeatureSource_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureSource" ADD CONSTRAINT "FeatureSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureSource" ADD CONSTRAINT "FeatureSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
