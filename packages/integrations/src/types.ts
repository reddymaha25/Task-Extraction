import { Task, IntegrationConfig, SyncStatus } from '@task-platform/shared';

export interface IntegrationAdapter {
  createTasks(
    tasks: Task[],
    config: IntegrationConfig,
    mappingOptions?: Record<string, any>
  ): Promise<Array<{
    taskId: string;
    status: SyncStatus;
    externalId?: string;
    errorMessage?: string;
  }>>;

  testConnection(config: IntegrationConfig): Promise<boolean>;
}
