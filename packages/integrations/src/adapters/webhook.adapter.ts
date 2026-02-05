import axios, { AxiosInstance } from 'axios';
import { IntegrationAdapter } from '../types';
import { Task, IntegrationConfig, SyncStatus } from '@task-platform/shared';

export class WebhookAdapter implements IntegrationAdapter {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

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
    const results = [];
    const webhookUrl = config.webhookUrl!;
    const batchMode = mappingOptions?.batchMode || false;

    if (batchMode) {
      // Send all tasks in one webhook call
      try {
        const payload = {
          tasks: tasks.map(task => this.formatTask(task)),
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'task-extraction-platform',
            ...mappingOptions?.metadata
          }
        };

        const response = await this.sendWebhook(webhookUrl, payload, config);

        // Mark all as successful if batch succeeds
        for (const task of tasks) {
          results.push({
            taskId: task.id,
            status: SyncStatus.SUCCESS,
            externalId: response?.batchId || `batch-${Date.now()}`,
          });
        }
      } catch (error: any) {
        // Mark all as failed if batch fails
        for (const task of tasks) {
          results.push({
            taskId: task.id,
            status: SyncStatus.FAILED,
            errorMessage: error.message,
          });
        }
      }
    } else {
      // Send each task individually
      for (const task of tasks) {
        try {
          const payload = {
            task: this.formatTask(task),
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'task-extraction-platform',
              ...mappingOptions?.metadata
            }
          };

          const response = await this.sendWebhook(webhookUrl, payload, config);

          results.push({
            taskId: task.id,
            status: SyncStatus.SUCCESS,
            externalId: response?.id || `webhook-${Date.now()}`,
          });
        } catch (error: any) {
          results.push({
            taskId: task.id,
            status: SyncStatus.FAILED,
            errorMessage: error.message,
          });
        }
      }
    }

    return results;
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      const testPayload = {
        test: true,
        message: 'Connection test from Task Extraction Platform',
        timestamp: new Date().toISOString(),
      };

      await this.sendWebhook(config.webhookUrl!, testPayload, config);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendWebhook(
    url: string,
    payload: any,
    config: IntegrationConfig
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers if provided
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    // Add authentication if provided
    if (config.webhookSecret) {
      headers['X-Webhook-Secret'] = config.webhookSecret;
    }

    if (config.apiToken) {
      headers['Authorization'] = `Bearer ${config.apiToken}`;
    }

    const response = await this.client.post(url, payload, { headers });
    return response.data;
  }

  private formatTask(task: Task): any {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      owner: task.ownerNormalized || task.ownerRaw,
      dueDate: task.dueDateISO,
      status: task.status,
      sourceQuote: task.sourceQuote,
      createdAt: task.createdAt,
    };
  }
}
