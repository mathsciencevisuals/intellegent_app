-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "mimeType" TEXT;
