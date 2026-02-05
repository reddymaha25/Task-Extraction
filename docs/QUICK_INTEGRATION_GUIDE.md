# Quick Integration Guide

## Microsoft To Do - Zero Configuration Setup 🚀

### 1. Get Access Token (2 minutes)

**Option A: Graph Explorer (Quick Test)**
```bash
1. Visit https://developer.microsoft.com/graph/graph-explorer
2. Sign in with your Microsoft account
3. Copy the access token from request headers
4. Token expires in ~1 hour (good for testing)
```

**Option B: Azure AD (Production)**
```bash
1. Visit https://portal.azure.com
2. Create App Registration
3. Add API Permission: Tasks.ReadWrite
4. Generate client secret
5. Use OAuth flow to get access token
```

### 2. Configure Environment

```env
MICROSOFT_TODO_ENABLED=true
MICROSOFT_TODO_ACCESS_TOKEN=your-token-here
MICROSOFT_TODO_LIST_ID=tasks  # Optional, defaults to "tasks"
```

### 3. Push Tasks via API

```bash
curl -X POST http://localhost:4000/api/v1/runs/{runId}/push \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "microsoft-todo",
    "taskIds": ["task-1", "task-2"],
    "mappingOptions": {
      "listId": "tasks"
    }
  }'
```

### 4. Verify in Microsoft To Do

- Open [Microsoft To Do](https://to-do.microsoft.com)
- Check your "Tasks" list
- See imported tasks with titles, descriptions, due dates

---

## Webhook Integration - Send to Anywhere 🔗

### 1. Set Up Webhook Endpoint

**Option A: Webhook.site (Test)**
```bash
1. Visit https://webhook.site
2. Copy your unique URL
3. Use it as WEBHOOK_URL
```

**Option B: Custom Endpoint**
```javascript
// Express.js example
app.post('/tasks', (req, res) => {
  const { task, metadata } = req.body;
  console.log('Received task:', task.title);
  
  // Process task...
  
  res.json({ id: 'external-id', status: 'created' });
});
```

### 2. Configure Environment

```env
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://your-endpoint.com/tasks
WEBHOOK_SECRET=your-secret-key
WEBHOOK_BATCH_MODE=false
```

### 3. Push Tasks

**Individual Mode** (one webhook call per task):
```bash
curl -X POST http://localhost:4000/api/v1/runs/{runId}/push \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "webhook",
    "taskIds": ["task-1", "task-2"],
    "mappingOptions": {
      "batchMode": false
    }
  }'
```

**Batch Mode** (all tasks in one call):
```bash
curl -X POST http://localhost:4000/api/v1/runs/{runId}/push \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "webhook",
    "taskIds": ["task-1", "task-2"],
    "mappingOptions": {
      "batchMode": true
    }
  }'
```

### 4. Webhook Payload Format

**Individual Task:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Task title",
    "description": "Description",
    "priority": "P1",
    "owner": "john@example.com",
    "dueDate": "2024-02-10T00:00:00Z",
    "status": "NEW",
    "sourceQuote": "Original text"
  },
  "metadata": {
    "timestamp": "2024-02-04T10:00:00Z",
    "source": "task-extraction-platform"
  }
}
```

**Batch:**
```json
{
  "tasks": [
    { "id": "uuid-1", "title": "Task 1", ... },
    { "id": "uuid-2", "title": "Task 2", ... }
  ],
  "metadata": {
    "timestamp": "2024-02-04T10:00:00Z",
    "source": "task-extraction-platform"
  }
}
```

---

## Common Use Cases

### 1. Send to Slack
```javascript
app.post('/tasks', async (req, res) => {
  const { task } = req.body;
  
  await slack.chat.postMessage({
    channel: '#tasks',
    text: `📋 *${task.title}*\n${task.description}`
  });
  
  res.json({ status: 'sent' });
});
```

### 2. Send to Database
```javascript
app.post('/tasks', async (req, res) => {
  const { task } = req.body;
  
  const result = await db.tasks.create({
    external_id: task.id,
    title: task.title,
    priority: task.priority
  });
  
  res.json({ id: result.id });
});
```

### 3. Send to Zapier/Make
```bash
# Just use their webhook URL
WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/123456/abcdef/
```

---

## Integration Comparison

| Feature | Microsoft To Do | Webhook |
|---------|----------------|---------|
| Setup Time | 2 minutes | 5 minutes |
| Authentication | OAuth token | Secret/API key |
| Batch Support | ❌ | ✅ |
| Custom Fields | Limited | Unlimited |
| Best For | Personal tasks | Custom systems |

---

## Troubleshooting

### Microsoft To Do

**"Invalid token"**
- Token expired (refresh it)
- Missing Tasks.ReadWrite permission

**"List not found"**
- Use Graph Explorer to list your lists
- Verify listId matches

### Webhook

**"Connection timeout"**
- Endpoint not reachable
- Takes > 30 seconds to respond

**"Unauthorized"**
- Check webhook secret matches
- Verify custom headers

---

## Next Steps

1. ✅ Try Microsoft To Do with Graph Explorer
2. ✅ Test Webhook with webhook.site
3. 🔄 Build custom webhook endpoint
4. 🔄 Integrate with your team's workflow
