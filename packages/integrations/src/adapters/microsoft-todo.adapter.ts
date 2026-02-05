import axios, { AxiosInstance } from 'axios';
import { IntegrationAdapter } from '../types';
import { Task, IntegrationConfig, SyncStatus } from '@task-platform/shared';

export class MicrosoftTodoAdapter implements IntegrationAdapter {
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
    const listId = mappingOptions?.listId || 'tasks'; // Default task list

    console.log('📝 Microsoft To Do Adapter starting:', {
      taskCount: tasks.length,
      listId,
      hasAccessToken: !!config.accessToken,
      accessTokenPreview: config.accessToken?.substring(0, 20) + '...'
    });

    for (const task of tasks) {
      try {
        const todoTask = {
          title: task.title,
          body: {
            content: task.description || task.sourceQuote,
            contentType: 'text'
          },
          importance: this.mapPriority(task.priority),
          ...(task.dueDateISO && {
            dueDateTime: {
              dateTime: task.dueDateISO,
              timeZone: 'UTC'
            }
          })
        };

        const response = await this.client.post(
          `/me/todo/lists/${listId}/tasks`,
          todoTask
        );

        console.log('✅ Microsoft To Do task created:', {
          taskId: task.id,
          externalId: response.data.id,
          title: response.data.title
        });

        results.push({
          taskId: task.id,
          status: SyncStatus.SUCCESS,
          externalId: response.data.id,
        });
      } catch (error: any) {
        console.error('❌ Microsoft To Do API Error:', {
          taskId: task.id,
          error: error.response?.data || error.message,
          status: error.response?.status,
          headers: error.response?.headers
        });
        results.push({
          taskId: task.id,
          status: SyncStatus.FAILED,
          errorMessage: error.response?.data?.error?.message || error.message,
        });
      }
    }

    return results;
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      this.client = this.createClient(config);
      // Test by fetching user's task lists
      await this.client.get('/me/todo/lists');
      return true;
    } catch (error) {
      return false;
    }
  }

  private createClient(config: IntegrationConfig): AxiosInstance {
    return axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private mapPriority(priority?: string): string {
    const map: Record<string, string> = {
      P0: 'high',
      P1: 'high',
      P2: 'normal',
      P3: 'low',
    };
    return priority ? (map[priority] || 'normal') : 'normal';
  }
}
