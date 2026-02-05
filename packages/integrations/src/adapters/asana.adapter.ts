import axios, { AxiosInstance } from 'axios';
import { IntegrationAdapter } from '../types';
import { Task, IntegrationConfig, SyncStatus } from '@task-platform/shared';

export class AsanaAdapter implements IntegrationAdapter {
  private client: AxiosInstance | null = null;

  async createTasks(
    tasks: Task[],
    config: IntegrationConfig,
    mappingOptions?: Record<string, any>
  ): Promise<Array<{
    taskId: string;
    status: SyncStatus;
    externalId?: string;
    errorMessage?: string;
  }>> {
    this.client = this.createClient(config);
    const results = [];

    for (const task of tasks) {
      try {
        const response = await this.client.post('/tasks', {
          data: {
            name: task.title,
            notes: task.description || task.sourceQuote,
            workspace: config.workspaceId,
            projects: config.projectId ? [config.projectId] : undefined,
            due_on: task.dueDateISO ? task.dueDateISO.split('T')[0] : undefined,
          },
        });

        results.push({
          taskId: task.id,
          status: SyncStatus.SUCCESS,
          externalId: response.data.data.gid,
        });
      } catch (error: any) {
        results.push({
          taskId: task.id,
          status: SyncStatus.FAILED,
          errorMessage: error.response?.data?.errors?.[0]?.message || error.message,
        });
      }
    }

    return results;
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      this.client = this.createClient(config);
      await this.client.get('/users/me');
      return true;
    } catch (error) {
      return false;
    }
  }

  private createClient(config: IntegrationConfig): AxiosInstance {
    return axios.create({
      baseURL: 'https://app.asana.com/api/1.0',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
