/*
  Warnings:

  - You are about to drop the column `fileName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `ExportArtifact` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `ExportArtifact` table. All the data in the column will be lost.
  - You are about to drop the column `stats` on the `Run` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Run` table. All the data in the column will be lost.
  - You are about to drop the column `sourceLocation` on the `Task` table. All the data in the column will be lost.
  - The `priority` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `contentHash` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storagePath` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `ExportArtifact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `ExportArtifact` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `ExportArtifact` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `displayName` to the `IntegrationTarget` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `IntegrationTarget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `inputType` on the `Run` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Run` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `llmMode` on the `Run` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileName",
DROP COLUMN "metadata",
ADD COLUMN     "contentHash" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "storagePath" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExportArtifact" DROP COLUMN "filePath",
DROP COLUMN "metadata",
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "IntegrationTarget" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Run" DROP COLUMN "stats",
DROP COLUMN "summary",
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "highConfidenceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "llmCallCount" INTEGER,
ADD COLUMN     "processingDurationMs" INTEGER,
ADD COLUMN     "summaryAsks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "summaryDecisions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "summaryKeyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "summaryRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "taskCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "inputType",
ADD COLUMN     "inputType" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
DROP COLUMN "llmMode",
ADD COLUMN     "llmMode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "sourceLocation",
ADD COLUMN     "sourceLocationLine" INTEGER,
ADD COLUMN     "sourceLocationPage" INTEGER,
ADD COLUMN     "sourceLocationParagraph" INTEGER,
ADD COLUMN     "sourceLocationSection" TEXT,
DROP COLUMN "priority",
ADD COLUMN     "priority" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NEW',
ALTER COLUMN "confidence" SET DEFAULT 0.5,
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "ExportType";

-- DropEnum
DROP TYPE "InputType";

-- DropEnum
DROP TYPE "IntegrationName";

-- DropEnum
DROP TYPE "LLMMode";

-- DropEnum
DROP TYPE "Priority";

-- DropEnum
DROP TYPE "RunStatus";

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateIndex
CREATE INDEX "Document_contentHash_idx" ON "Document"("contentHash");

-- CreateIndex
CREATE INDEX "ExportArtifact_expiresAt_idx" ON "ExportArtifact"("expiresAt");

-- CreateIndex
CREATE INDEX "IntegrationTarget_name_idx" ON "IntegrationTarget"("name");

-- CreateIndex
CREATE INDEX "IntegrationTarget_isActive_idx" ON "IntegrationTarget"("isActive");

-- CreateIndex
CREATE INDEX "Run_status_idx" ON "Run"("status");

-- CreateIndex
CREATE INDEX "Run_inputType_idx" ON "Run"("inputType");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "TaskSyncResult_status_idx" ON "TaskSyncResult"("status");
