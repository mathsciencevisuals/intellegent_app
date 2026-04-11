-- CreateTable
CREATE TABLE "WorkspaceAIConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "featureExtractionModel" TEXT NOT NULL DEFAULT 'claude-opus-4-6',
    "summarizationModel" TEXT NOT NULL DEFAULT 'claude-opus-4-6',
    "reportGenerationModel" TEXT NOT NULL DEFAULT 'claude-opus-4-6',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxTokens" INTEGER NOT NULL DEFAULT 8000,
    "useWorkspaceApiKey" BOOLEAN NOT NULL DEFAULT false,
    "workspaceApiKeyEncrypted" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceAIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "WorkspaceAIConfig_workspaceId_key" ON "WorkspaceAIConfig"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceAIConfig" ADD CONSTRAINT "WorkspaceAIConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ExtractionJob"
ADD COLUMN "providerUsed" TEXT,
ADD COLUMN "modelUsed" TEXT,
ADD COLUMN "promptVersionUsed" TEXT,
ADD COLUMN "temperatureUsed" DOUBLE PRECISION;
