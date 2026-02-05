# @task-platform/shared

## Purpose
Shared types, constants, validators, and utilities used across all packages and applications.

## Responsibilities
- Domain model type definitions (Run, Task, Document, etc.)
- API request/response schemas with Zod validation
- Shared constants and enums
- Common utility functions
- Type-safe contracts between frontend and backend

## Key Exports

### Domain Types
- `Run` - Extraction run metadata
- `Task` - Extracted task with traceability
- `Document` - Uploaded file metadata
- `IntegrationTarget` - External system configuration
- `TaskSyncResult` - Integration push results
- `ExportArtifact` - Generated export metadata
- `StakeholderSummary` - Extracted decisions/risks/asks

### Enums
- `InputType` - TEXT | PDF | DOCX | EML | WEBHOOK
- `RunStatus` - PENDING | PROCESSING | COMPLETE | FAILED
- `LLMMode` - OPEN_SOURCE | OPENAI
- `Priority` - P0 | P1 | P2 | P3
- `TaskStatus` - NEW | IN_PROGRESS | BLOCKED | DONE | UNKNOWN
- `ExportType` - XLSX | CSV | JSON
- `IntegrationName` - JIRA | ASANA | PLANNER | CUSTOM_WEBHOOK

### Validators
All API request/response schemas are defined with Zod for runtime validation.

## Usage

```typescript
import { 
  Run, 
  Task, 
  CreateRunRequest, 
  InputType,
  validateCreateRunRequest 
} from '@task-platform/shared';

// Type-safe domain models
const run: Run = { ... };

// Validated API requests
const result = validateCreateRunRequest(requestBody);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

## Design Principles
- **Stable contracts**: Domain types should rarely change
- **Validation at edges**: Use Zod schemas for all external inputs
- **No business logic**: This package contains only types and validation
- **Copilot-friendly**: Well-documented types with examples
