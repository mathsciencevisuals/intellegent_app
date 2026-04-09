-- AlterEnum
ALTER TYPE "FeatureStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Feature"
ADD COLUMN     "mergedIntoFeatureId" TEXT;

-- CreateIndex
CREATE INDEX "Feature_mergedIntoFeatureId_idx" ON "Feature"("mergedIntoFeatureId");

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_mergedIntoFeatureId_fkey" FOREIGN KEY ("mergedIntoFeatureId") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;
