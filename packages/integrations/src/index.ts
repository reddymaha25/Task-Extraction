export * from './types';
export { JiraAdapter } from './adapters/jira.adapter';
export { AsanaAdapter } from './adapters/asana.adapter';
export { MicrosoftTodoAdapter } from './adapters/microsoft-todo.adapter';
export { WebhookAdapter } from './adapters/webhook.adapter';

import { IntegrationAdapter } from './types';
import { JiraAdapter } from './adapters/jira.adapter';
import { AsanaAdapter } from './adapters/asana.adapter';
import { MicrosoftTodoAdapter } from './adapters/microsoft-todo.adapter';
import { WebhookAdapter } from './adapters/webhook.adapter';
import { IntegrationName } from '@task-platform/shared';

export function createIntegrationAdapter(name: IntegrationName): IntegrationAdapter {
  switch (name) {
    case IntegrationName.JIRA:
      return new JiraAdapter();
    case IntegrationName.ASANA:
      return new AsanaAdapter();
    case IntegrationName.MICROSOFT_TODO:
      return new MicrosoftTodoAdapter();
    case IntegrationName.WEBHOOK:
      return new WebhookAdapter();
    default:
      throw new Error(`Unsupported integration: ${name}`);
  }
}
