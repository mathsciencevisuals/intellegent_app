-- AlterTable
ALTER TABLE "Document"
ADD COLUMN     "analysisStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "analysisResult" JSONB,
ADD COLUMN     "roadmapResult" JSONB;
