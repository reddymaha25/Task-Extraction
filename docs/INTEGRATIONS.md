# Integrations Guide

This guide explains how to set up and use integrations to push tasks to external project management systems.

## Supported Integrations

- **Jira** - Atlassian Jira Cloud or Server
- **Asana** - Asana task management
- **Microsoft To Do** - Personal task management ⚡ **NEW**
- **Webhook** - Generic webhook for custom integrations ⚡ **NEW**
- **Microsoft Planner** - (Future implementation)

## Jira Integration

### Prerequisites

1. Jira Cloud account or Server instance
2. API token (Jira Cloud) or PAT (Jira Server)
3. Project key where tasks will be created

### Setup

#### 1. Generate API Token

**Jira Cloud:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token

**Jira Server/Data Center:**
1. Use your username and password
2. Or create a Personal Access Token (PAT)

#### 2. Configure Integration Target

Create a target in the database or through the API:

```typescript
// Example configuration
{
  "name": "JIRA",
  "config": {
    "baseUrl": "https://yourcompany.atlassian.net",
    "email": "your-email@company.com",
    "apiToken": "your-api-token",
    "defaultProject": "PROJ",
    "defaultIssueType": "Task"
  }
}
```

#### 3. Environment Variables (Optional Global Config)

Add to `.env`:

```env
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_DEFAULT_PROJECT=PROJ
```

### Usage

#### Via API

```http
POST /api/v1/runs/:runId/push
Content-Type: application/json

{
  "targetId": "jira-target-id",
  "taskIds": ["task-uuid-1", "task-uuid-2"],
  "mappingOptions": {
    "issueType": "Story",
    "projectKey": "PROJ"
  }
}
```

#### Via Frontend

1. Navigate to run detail page
2. Select tasks to push
3. Click "Push to Jira"
4. Select target configuration
5. Review created issues

### Field Mapping

| Platform Field | Jira Field | Notes |
|----------------|------------|-------|
| title | summary | Task title |
| description | description | Full description |
| priority | priority | P0→Highest, P1→High, P2→Medium, P3→Low |
| ownerNormalized | assignee | Email or username |
| dueDateISO | duedate | ISO date |
| tags | labels | Array of strings |

### Priority Mapping

```typescript
P0 → Highest
P1 → High
P2 → Medium
P3 → Low
```

### Error Handling

Common errors:
- `Invalid project key` - Check project exists and you have access
- `Field required` - Check Jira project's required fields
- `User not found` - Assignee email doesn't match Jira user

## Asana Integration

### Prerequisites

1. Asana account
2. Personal Access Token (PAT)
3. Workspace GID

### Setup

#### 1. Generate Personal Access Token

1. Go to https://app.asana.com/0/my-apps
2. Click "+ Create new token"
3. Name it and copy the token

#### 2. Get Workspace GID

```bash
curl https://app.asana.com/api/1.0/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Configure Integration Target

```typescript
{
  "name": "ASANA",
  "config": {
    "accessToken": "your-personal-access-token",
    "workspaceGid": "123456789",
    "defaultProjectGid": "987654321"  // Optional
  }
}
```

#### 4. Environment Variables

Add to `.env`:

```env
ASANA_ACCESS_TOKEN=your-personal-access-token
ASANA_WORKSPACE_GID=123456789
ASANA_PROJECT_GID=987654321
```

### Usage

```http
POST /api/v1/runs/:runId/push
Content-Type: application/json

{
  "targetId": "asana-target-id",
  "taskIds": ["task-uuid-1"],
  "mappingOptions": {
    "projectGid": "987654321"
  }
}
```

### Field Mapping

| Platform Field | Asana Field | Notes |
|----------------|-------------|-------|
| title | name | Task name |
| description | notes | Task description |
| ownerNormalized | assignee | Email |
| dueDateISO | due_on | Date only (no time) |
| tags | tags | Array of tag GIDs |

### Limitations

- Asana doesn't have native priority field (can use custom fields)
- Due dates are date-only (time is ignored)
- Assignee must be workspace member

## Microsoft To Do ⚡ NEW

### Prerequisites

1. Microsoft account with To Do access
2. OAuth access token (using Microsoft Graph API)

### Setup

#### 1. Get OAuth Access Token

Microsoft To Do uses Microsoft Graph API. You can obtain a token using:

**Option A: Azure AD App Registration (Recommended for production)**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Click "New registration"
4. Set name and redirect URI
5. Under "API permissions", add `Tasks.ReadWrite`
6. Generate client secret
7. Use OAuth 2.0 flow to get access token

**Option B: Quick Test (Graph Explorer)**

1. Go to [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Sign in
3. Copy the access token from the request headers
4. Note: This token expires quickly, only use for testing

#### 2. Get Task List ID (Optional)

By default, tasks are created in the main "Tasks" list. To use a specific list:

```bash
curl https://graph.microsoft.com/v1.0/me/todo/lists \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3. Configure Integration

```typescript
{
  "name": "MICROSOFT_TODO",
  "config": {
    "accessToken": "your-microsoft-graph-access-token"
  }
}
```

#### 4. Environment Variables

Add to `.env`:

```env
MICROSOFT_TODO_ENABLED=true
MICROSOFT_TODO_ACCESS_TOKEN=your-access-token
MICROSOFT_TODO_LIST_ID=tasks  # Optional, defaults to "tasks"
```

### Usage

```http
POST /api/v1/runs/:runId/push
Content-Type: application/json

{
  "targetId": "microsoft-todo-target-id",
  "taskIds": ["task-uuid-1", "task-uuid-2"],
  "mappingOptions": {
    "listId": "AQMkADAwATM0MDAAMS1iNTcyLTI2NWQtMD..."  // Optional
  }
}
```

### Field Mapping

| Platform Field | Microsoft To Do Field | Notes |
|----------------|----------------------|-------|
| title | title | Task title (required) |
| description | body.content | Task description |
| priority | importance | P0/P1→high, P2→normal, P3→low |
| dueDateISO | dueDateTime | ISO 8601 datetime |
| status | status | Maps to notStarted/inProgress/completed |

### Priority Mapping

```typescript
P0 → high
P1 → high
P2 → normal
P3 → low
```

### Limitations

- No native assignee field (To Do is personal)
- Limited custom fields
- Access token expires (refresh token recommended for production)

## Webhook Integration ⚡ NEW

### Overview

The Webhook integration allows you to send tasks to any HTTP endpoint. Perfect for:
- Custom internal systems
- Zapier/Make.com workflows
- Serverless functions
- Notification systems

### Setup

#### 1. Configure Webhook Endpoint

```typescript
{
  "name": "WEBHOOK",
  "config": {
    "webhookUrl": "https://your-endpoint.com/tasks",
    "webhookSecret": "optional-secret-for-verification",
    "customHeaders": {
      "X-Custom-Header": "value"
    }
  }
}
```

#### 2. Environment Variables

Add to `.env`:

```env
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://your-endpoint.com/tasks
WEBHOOK_SECRET=your-secret-key
WEBHOOK_BATCH_MODE=false  # true to send all tasks in one request
```

### Usage

#### Individual Mode (Default)

Each task is sent as a separate webhook call:

```http
POST /api/v1/runs/:runId/push
Content-Type: application/json

{
  "targetId": "webhook-target-id",
  "taskIds": ["task-1", "task-2"],
  "mappingOptions": {
    "batchMode": false,
    "metadata": {
      "source": "email-thread",
      "extractionDate": "2024-02-04"
    }
  }
}
```

**Webhook Payload (per task):**

```json
{
  "task": {
    "id": "uuid",
    "title": "Task title",
    "description": "Description",
    "priority": "P1",
    "assignee": "john@example.com",
    "dueDate": "2024-02-10T00:00:00Z",
    "status": "NEW",
    "sourceQuote": "Original text from document",
    "createdAt": "2024-02-04T10:00:00Z"
  },
  "metadata": {
    "timestamp": "2024-02-04T10:05:00Z",
    "source": "task-extraction-platform",
    "extractionDate": "2024-02-04"
  }
}
```

#### Batch Mode

All tasks sent in a single webhook call:

```http
POST /api/v1/runs/:runId/push
Content-Type: application/json

{
  "targetId": "webhook-target-id",
  "taskIds": ["task-1", "task-2", "task-3"],
  "mappingOptions": {
    "batchMode": true,
    "metadata": {
      "runId": "run-uuid"
    }
  }
}
```

**Webhook Payload (batch):**

```json
{
  "tasks": [
    {
      "id": "uuid-1",
      "title": "First task",
      ...
    },
    {
      "id": "uuid-2",
      "title": "Second task",
      ...
    }
  ],
  "metadata": {
    "timestamp": "2024-02-04T10:05:00Z",
    "source": "task-extraction-platform",
    "runId": "run-uuid"
  }
}
```

### Security

#### Webhook Secret

If `webhookSecret` is configured, it's sent in the `X-Webhook-Secret` header:

```javascript
// Your webhook endpoint validation
const receivedSecret = req.headers['x-webhook-secret'];
if (receivedSecret !== process.env.EXPECTED_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

#### API Token

If `apiToken` is configured in the integration config, it's sent as a Bearer token:

```
Authorization: Bearer your-api-token
```

#### Custom Headers

Add any custom headers needed by your endpoint:

```typescript
{
  "customHeaders": {
    "X-API-Key": "your-api-key",
    "X-Tenant-ID": "tenant-123"
  }
}
```

### Response Format

Your webhook endpoint should return:

**Success:**
```json
{
  "id": "external-task-id",
  "status": "created"
}
```

**Batch Success:**
```json
{
  "batchId": "batch-12345",
  "status": "processed",
  "count": 3
}
```

**Error:**
```json
{
  "error": "Invalid payload",
  "details": "Missing required field: title"
}
```

### Use Cases

#### 1. Slack Notification

```javascript
// Your webhook endpoint
app.post('/tasks', (req, res) => {
  const { task } = req.body;
  
  await slack.chat.postMessage({
    channel: '#tasks',
    text: `New task: *${task.title}*\nPriority: ${task.priority}\nDue: ${task.dueDate}`
  });
  
  res.json({ id: 'slack-msg-id', status: 'sent' });
});
```

#### 2. Database Insert

```javascript
app.post('/tasks', async (req, res) => {
  const { task } = req.body;
  
  const result = await db.tasks.create({
    external_id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    due_date: task.dueDate
  });
  
  res.json({ id: result.id, status: 'created' });
});
```

#### 3. Zapier/Make Webhook

Configure webhook URL from Zapier/Make and use their workflow builder to process tasks.

### Error Handling

- Webhook timeouts after 30 seconds
- Failed webhooks are marked as FAILED with error message
- Supports retry logic (implement in your endpoint)

## Microsoft Planner (Future)

### Planned Support

```typescript
{
  "name": "PLANNER",
  "config": {
    "tenantId": "tenant-id",
    "clientId": "client-id",
    "clientSecret": "client-secret",
    "planId": "plan-id"
  }
}
```

Implementation coming soon.

## Creating Custom Integrations

### Step 1: Create Adapter

Create `packages/integrations/src/adapters/myservice.adapter.ts`:

```typescript
import { IntegrationAdapter, IntegrationConfig, IntegrationResult } from '../types';
import { Task } from '@task-platform/shared';
import axios from 'axios';

export class MyServiceAdapter implements IntegrationAdapter {
  constructor(private config: IntegrationConfig) {}

  async testConnection(): Promise<boolean> {
    try {
      // Test API connectivity
      await axios.get(`${this.config.baseUrl}/api/test`, {
        headers: { Authorization: `Bearer ${this.config.apiToken}` }
      });
      return true;
    } catch {
      return false;
    }
  }

  async createTasks(tasks: Task[], options?: any): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = [];

    for (const task of tasks) {
      try {
        const response = await axios.post(
          `${this.config.baseUrl}/api/tasks`,
          {
            title: task.title,
            description: task.description,
            // Map other fields
          },
          {
            headers: { Authorization: `Bearer ${this.config.apiToken}` }
          }
        );

        results.push({
          taskId: task.id,
          status: 'SUCCESS',
          externalId: response.data.id,
        });
      } catch (error: any) {
        results.push({
          taskId: task.id,
          status: 'FAILED',
          errorMessage: error.message,
        });
      }
    }

    return results;
  }
}
```

### Step 2: Register in Factory

Update `packages/integrations/src/index.ts`:

```typescript
import { MyServiceAdapter } from './adapters/myservice.adapter';

export function createIntegrationAdapter(
  name: IntegrationName,
  config: IntegrationConfig
): IntegrationAdapter {
  switch (name) {
    case IntegrationName.JIRA:
      return new JiraAdapter(config);
    case IntegrationName.ASANA:
      return new AsanaAdapter(config);
    case IntegrationName.MYSERVICE:
      return new MyServiceAdapter(config);
    default:
      throw new Error(`Unsupported integration: ${name}`);
  }
}
```

### Step 3: Add Enum

Update `packages/shared/src/enums.ts`:

```typescript
export enum IntegrationName {
  JIRA = 'JIRA',
  ASANA = 'ASANA',
  PLANNER = 'PLANNER',
  MYSERVICE = 'MYSERVICE',
}
```

### Step 4: Test

```typescript
const adapter = createIntegrationAdapter(IntegrationName.MYSERVICE, {
  baseUrl: 'https://api.myservice.com',
  apiToken: 'token',
});

const connected = await adapter.testConnection();
const results = await adapter.createTasks(tasks);
```

## Best Practices

### Security

- Store credentials in environment variables or encrypted database
- Use API tokens instead of passwords
- Rotate tokens periodically
- Limit token permissions to minimum required

### Error Handling

- Always validate connection before bulk push
- Retry transient failures (network errors)
- Log all integration attempts
- Provide clear error messages to users

### Rate Limiting

- Implement backoff for rate-limited APIs
- Batch operations when possible
- Cache frequently accessed data (user info, projects)

### Testing

- Test connection before pushing tasks
- Verify field mappings with sample data
- Check permissions (can assignee be set?)
- Handle edge cases (missing optional fields)

## Troubleshooting

### "Connection failed"

1. Check credentials are correct
2. Verify network access to API endpoint
3. Check API token hasn't expired
4. Review API rate limits

### "Task creation failed"

1. Verify required fields are provided
2. Check field format matches API requirements
3. Ensure user has permissions
4. Review API error response for details

### "User not found"

1. Email must match exactly in external system
2. User must be member of workspace/project
3. Use API to verify user exists

### "Invalid priority/status"

1. Check external system's allowed values
2. Verify mapping configuration
3. Use custom field if native field unavailable

## API Reference

### Test Connection

```http
POST /api/v1/integrations/:targetId/test
```

### Push Tasks

```http
POST /api/v1/runs/:runId/push
Content-Type: application/json

{
  "targetId": "integration-target-id",
  "taskIds": ["task-1", "task-2"],
  "mappingOptions": {
    // Integration-specific options
  }
}
```

### Get Sync History

```http
GET /api/v1/tasks/:taskId/sync-history
```

Response:
```json
{
  "results": [
    {
      "id": "sync-result-id",
      "targetId": "jira-target",
      "externalId": "PROJ-123",
      "status": "SUCCESS",
      "syncedAt": "2024-02-01T10:00:00Z"
    }
  ]
}
```
