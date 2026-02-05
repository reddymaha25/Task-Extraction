-- CreateEnum for InputType
CREATE TYPE "InputType" AS ENUM ('TEXT', 'PDF', 'DOCX', 'EML');

-- CreateEnum for RunStatus
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateEnum for LLMMode
CREATE TYPE "LLMMode" AS ENUM ('OPEN_SOURCE', 'OPENAI');

-- CreateEnum for Priority
CREATE TYPE "Priority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateEnum for TaskStatus
CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum for ExportType
CREATE TYPE "ExportType" AS ENUM ('XLSX', 'CSV', 'JSON');

-- CreateEnum for IntegrationName
CREATE TYPE "IntegrationName" AS ENUM ('JIRA', 'ASANA', 'PLANNER');

-- CreateTable Run
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "inputType" "InputType" NOT NULL,
    "sourceName" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "llmMode" "LLMMode" NOT NULL DEFAULT 'OPEN_SOURCE',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "referenceTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB,
    "stats" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "extractedText" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerRaw" TEXT,
    "ownerNormalized" TEXT,
    "dueDateRaw" TEXT,
    "dueDateISO" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'P2',
    "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceQuote" TEXT NOT NULL,
    "sourceLocation" JSONB,
    "tags" TEXT[],
    "integrationState" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable IntegrationTarget
CREATE TABLE "IntegrationTarget" (
    "id" TEXT NOT NULL,
    "name" "IntegrationName" NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable TaskSyncResult
CREATE TABLE "TaskSyncResult" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSyncResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExportArtifact
CREATE TABLE "ExportArtifact" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "taskCount" INTEGER NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Run_status_idx" ON "Run"("status");
CREATE INDEX "Run_createdAt_idx" ON "Run"("createdAt");

-- CreateIndex
CREATE INDEX "Document_runId_idx" ON "Document"("runId");

-- CreateIndex
CREATE INDEX "Task_runId_idx" ON "Task"("runId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_confidence_idx" ON "Task"("confidence");
CREATE INDEX "Task_dueDateISO_idx" ON "Task"("dueDateISO");

-- CreateIndex
CREATE INDEX "TaskSyncResult_taskId_idx" ON "TaskSyncResult"("taskId");
CREATE INDEX "TaskSyncResult_targetId_idx" ON "TaskSyncResult"("targetId");

-- CreateIndex
CREATE INDEX "ExportArtifact_runId_idx" ON "ExportArtifact"("runId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSyncResult" ADD CONSTRAINT "TaskSyncResult_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSyncResult" ADD CONSTRAINT "TaskSyncResult_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "IntegrationTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportArtifact" ADD CONSTRAINT "ExportArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
