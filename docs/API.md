# API Documentation

Base URL: `http://localhost:3001/api/v1`

## Authentication

*Note: Authentication is not implemented in the POC. Add JWT or OAuth in production.*

## Runs

### Create a Run

```http
POST /runs
Content-Type: application/json

{
  "inputType": "TEXT",
  "text": "Optional if inputType is TEXT",
  "fileId": "Optional if inputType is PDF/DOCX/EML",
  "timezone": "America/New_York",
  "referenceTime": "2024-02-01T10:00:00Z",
  "llmMode": "OPEN_SOURCE",
  "sourceName": "Optional source identifier"
}
```

Response:
```json
{
  "runId": "uuid",
  "status": "PENDING",
  "createdAt": "2024-02-01T10:00:00Z"
}
```

### Process a Run

```http
POST /runs/:runId/process
Content-Type: application/json

{
  "text": "Required if inputType is TEXT",
  "fileId": "Required if inputType is file"
}
```

Response:
```json
{
  "runId": "uuid",
  "status": "COMPLETE",
  "taskCount": 5,
  "processingTimeMs": 3450
}
```

### Get Run Details

```http
GET /runs/:runId
```

Response:
```json
{
  "id": "uuid",
  "inputType": "TEXT",
  "sourceName": "Meeting Notes",
  "status": "COMPLETE",
  "llmMode": "OPEN_SOURCE",
  "summary": {
    "decisions": ["Delay rollout to March 1"],
    "risks": ["Infrastructure concerns"],
    "asks": [],
    "keyPoints": []
  },
  "stats": {
    "taskCount": 5,
    "highConfidenceCount": 3,
    "processingDurationMs": 3450,
    "llmCallCount": 3
  },
  "createdAt": "2024-02-01T10:00:00Z",
  "updatedAt": "2024-02-01T10:01:00Z"
}
```

### List Runs

```http
GET /runs?page=1&limit=20&status=COMPLETE&inputType=TEXT
```

Response:
```json
{
  "runs": [
    {
      "id": "uuid",
      "inputType": "TEXT",
      "sourceName": "Meeting Notes",
      "status": "COMPLETE",
      "taskCount": 5,
      "createdAt": "2024-02-01T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

## Tasks

### Get Tasks for a Run

```http
GET /tasks?runId=uuid
```

Response:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "runId": "uuid",
      "title": "Finalize dashboard",
      "description": "Critical for the launch",
      "ownerRaw": "Rayan",
      "ownerNormalized": null,
      "dueDateRaw": "next Friday",
      "dueDateISO": "2024-02-09T00:00:00Z",
      "priority": "P0",
      "status": "NEW",
      "confidence": 0.95,
      "sourceQuote": "Rayan, please finalize the dashboard by next Friday. This is critical for the launch.",
      "sourceLocation": {
        "page": null,
        "section": null,
        "paragraphIndex": 1
      },
      "tags": [],
      "integrationState": {},
      "createdAt": "2024-02-01T10:00:00Z",
      "updatedAt": "2024-02-01T10:00:00Z"
    }
  ],
  "total": 5
}
```

### Update a Task

```http
PATCH /tasks/:taskId
Content-Type: application/json

{
  "title": "Updated title",
  "ownerNormalized": "rayan@company.com",
  "dueDateISO": "2024-02-15T00:00:00Z",
  "priority": "P1",
  "status": "IN_PROGRESS",
  "tags": ["critical", "launch"]
}
```

## Uploads

### Upload a File

```http
POST /uploads
Content-Type: multipart/form-data

file: <binary>
```

Response:
```json
{
  "fileId": "uuid-filename.pdf",
  "originalName": "meeting-notes.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 123456,
  "uploadedAt": "2024-02-01T10:00:00Z"
}
```

## Exports

### Create an Export

```http
POST /runs/:runId/exports
Content-Type: application/json

{
  "type": "XLSX",
  "taskIds": ["uuid1", "uuid2"],
  "includeMetadata": true
}
```

Response:
```json
{
  "exportId": "uuid",
  "type": "XLSX",
  "taskCount": 5,
  "downloadUrl": "/api/v1/exports/uuid/download",
  "expiresAt": "2024-02-08T10:00:00Z"
}
```

### Download an Export

```http
GET /exports/:exportId/download
```

Returns file download.

## Integrations

### Push Tasks to Integration

```http
POST /runs/:runId/push
Content-Type: application/json

{
  "targetId": "jira-target-id",
  "taskIds": ["uuid1", "uuid2"],
  "mappingOptions": {
    "issueType": "Task",
    "projectKey": "PROJ"
  }
}
```

Response:
```json
{
  "targetId": "jira-target-id",
  "results": [
    {
      "taskId": "uuid1",
      "status": "SUCCESS",
      "externalId": "PROJ-123"
    },
    {
      "taskId": "uuid2",
      "status": "FAILED",
      "errorMessage": "Invalid project key"
    }
  ],
  "successCount": 1,
  "failureCount": 1
}
```

## Webhooks

### Email Webhook

```http
POST /webhooks/email
Content-Type: application/json

{
  "subject": "Q1 Planning Meeting",
  "from": "sender@company.com",
  "to": ["recipient@company.com"],
  "date": "2024-02-01T10:00:00Z",
  "bodyText": "Meeting notes...",
  "bodyHtml": "<html>...",
  "attachments": []
}
```

Response:
```json
{
  "runId": "uuid",
  "status": "PENDING",
  "message": "Webhook received, processing started"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error
