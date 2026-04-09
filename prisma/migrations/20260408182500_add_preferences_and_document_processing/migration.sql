-- CreateEnum
CREATE TYPE "WorkspaceListDensity" AS ENUM ('COMFORTABLE', 'COMPACT');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "weeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workspaceListDensity" "WorkspaceListDensity" NOT NULL DEFAULT 'COMFORTABLE';

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "processingSummary" TEXT;
