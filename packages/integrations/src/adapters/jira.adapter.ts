import axios, { AxiosInstance } from 'axios';
import { IntegrationAdapter } from '../types';
import { Task, IntegrationConfig, SyncStatus } from '@task-platform/shared';

export class JiraAdapter implements IntegrationAdapter {
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
        const response = await this.client.post('/rest/api/3/issue', {
          fields: {
            project: { key: config.projectKey },
            summary: task.title,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: task.description || task.sourceQuote },
                  ],
                },
              ],
            },
            issuetype: { name: mappingOptions?.issueType || 'Task' },
            ...(task.dueDateISO && { duedate: task.dueDateISO.split('T')[0] }),
            ...(task.priority && { priority: { name: this.mapPriority(task.priority) } }),
          },
        });

        results.push({
          taskId: task.id,
          status: SyncStatus.SUCCESS,
          externalId: response.data.key,
        });
      } catch (error: any) {
        results.push({
          taskId: task.id,
          status: SyncStatus.FAILED,
          errorMessage: error.response?.data?.errorMessages?.[0] || error.message,
        });
      }
    }

    return results;
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      this.client = this.createClient(config);
      await this.client.get('/rest/api/3/myself');
      return true;
    } catch (error) {
      return false;
    }
  }

  private createClient(config: IntegrationConfig): AxiosInstance {
    return axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.email!,
        password: config.apiToken!,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private mapPriority(priority: string): string {
    const map: Record<string, string> = {
      P0: 'Highest',
      P1: 'High',
      P2: 'Medium',
      P3: 'Low',
    };
    return map[priority] || 'Medium';
  }
}
