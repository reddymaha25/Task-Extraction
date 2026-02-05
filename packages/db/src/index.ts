/**
 * Database package exports
 */

export { prisma, disconnect, healthCheck } from './client';
export { createRunRepository, RunRepository } from './repositories/run.repository';
export { createTaskRepository, TaskRepository } from './repositories/task.repository';

// Re-export Prisma types for convenience
export type { 
  Run as PrismaRun,
  Document as PrismaDocument,
  Task as PrismaTask,
  IntegrationTarget as PrismaIntegrationTarget,
  TaskSyncResult as PrismaTaskSyncResult,
  ExportArtifact as PrismaExportArtifact
} from '@prisma/client';
