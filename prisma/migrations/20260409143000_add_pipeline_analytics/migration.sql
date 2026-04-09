-- CreateEnum
CREATE TYPE "MaturityTier" AS ENUM ('NON_AGENTIC', 'PARTIAL', 'AGENTIC');

-- AlterTable
ALTER TABLE "Feature"
ADD COLUMN     "capabilityId" TEXT;

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "extractionJobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "extractedFeatureCount" INTEGER NOT NULL DEFAULT 0,
    "hiddenFeatureEstimate" INTEGER NOT NULL DEFAULT 0,
    "currentMaturityTier" "MaturityTier" NOT NULL,
    "confidenceAvg" INTEGER,
    "summaryNarrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityAssessment" (
    "id" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "maturityTier" "MaturityTier" NOT NULL,
    "rationale" TEXT NOT NULL,
    "complexityScore" INTEGER NOT NULL,
    "agentTypeLabel" TEXT NOT NULL,
    "weeklyHoursWasted" INTEGER NOT NULL,
    "yearlyHoursWasted" INTEGER NOT NULL,
    "annualDollarImpact" INTEGER NOT NULL,
    "repeatabilityScore" INTEGER NOT NULL,
    "roiScore" INTEGER NOT NULL,
    "dataAvailabilityScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "compositeOpportunityScore" INTEGER NOT NULL,
    "impactTags" TEXT[],
    "scoreExplanations" JSONB NOT NULL,
    "implementationGuidance" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapRecommendation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "extractionJobId" TEXT NOT NULL,
    "capabilityId" TEXT,
    "priority" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "quickWin" BOOLEAN NOT NULL DEFAULT false,
    "kpisJson" JSONB NOT NULL,
    "risksJson" JSONB NOT NULL,
    "breakEvenMonths" INTEGER NOT NULL,
    "implementationNotes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "extractionJobId" TEXT NOT NULL,
    "kpiJson" JSONB NOT NULL,
    "moduleBreakdownJson" JSONB NOT NULL,
    "donutChartJson" JSONB NOT NULL,
    "topOpportunitiesJson" JSONB NOT NULL,
    "roadmapStatsJson" JSONB NOT NULL,
    "riskRegisterJson" JSONB NOT NULL,
    "quickWinsJson" JSONB NOT NULL,
    "uiCopyJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feature_capabilityId_idx" ON "Feature"("capabilityId");

-- CreateIndex
CREATE INDEX "Capability_workspaceId_extractionJobId_idx" ON "Capability"("workspaceId", "extractionJobId");

-- CreateIndex
CREATE INDEX "Capability_workspaceId_module_idx" ON "Capability"("workspaceId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityAssessment_capabilityId_key" ON "CapabilityAssessment"("capabilityId");

-- CreateIndex
CREATE INDEX "RoadmapRecommendation_workspaceId_extractionJobId_priority_idx" ON "RoadmapRecommendation"("workspaceId", "extractionJobId", "priority");

-- CreateIndex
CREATE INDEX "RoadmapRecommendation_capabilityId_idx" ON "RoadmapRecommendation"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSnapshot_extractionJobId_key" ON "DashboardSnapshot"("extractionJobId");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_workspaceId_createdAt_idx" ON "DashboardSnapshot"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_extractionJobId_fkey" FOREIGN KEY ("extractionJobId") REFERENCES "ExtractionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityAssessment" ADD CONSTRAINT "CapabilityAssessment_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendation" ADD CONSTRAINT "RoadmapRecommendation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendation" ADD CONSTRAINT "RoadmapRecommendation_extractionJobId_fkey" FOREIGN KEY ("extractionJobId") REFERENCES "ExtractionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendation" ADD CONSTRAINT "RoadmapRecommendation_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_extractionJobId_fkey" FOREIGN KEY ("extractionJobId") REFERENCES "ExtractionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
