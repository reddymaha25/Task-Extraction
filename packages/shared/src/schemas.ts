import { z } from 'zod';
import { InputType, LLMMode, Priority, TaskStatus, IntegrationName, ExportType } from './enums';

/**
 * API Request/Response schemas with Zod validation
 */

// ==================== Run Endpoints ====================

/**
 * POST /v1/runs - Create a new extraction run
 */
export const CreateRunRequestSchema = z.object({
  inputType: z.nativeEnum(InputType),
  text: z.string().optional(), // Required if inputType is TEXT
  fileId: z.string().optional(), // Required if inputType is PDF/DOCX/EML
  timezone: z.string().default('UTC'), // IANA timezone
  referenceTime: z.string().datetime().optional(), // ISO 8601, defaults to now
  sourceName: z.string().optional()
});

export type CreateRunRequest = z.infer<typeof CreateRunRequestSchema>;

export const CreateRunResponseSchema = z.object({
  runId: z.string(),
  status: z.string(),
  createdAt: z.string().datetime()
});

export type CreateRunResponse = z.infer<typeof CreateRunResponseSchema>;

/**
 * POST /v1/runs/:runId/process - Start extraction pipeline
 */
export const ProcessRunResponseSchema = z.object({
  runId: z.string(),
  status: z.string(),
  taskCount: z.number(),
  processingTimeMs: z.number()
});

export type ProcessRunResponse = z.infer<typeof ProcessRunResponseSchema>;

/**
 * GET /v1/runs/:runId - Get run details
 */
export const GetRunResponseSchema = z.object({
  id: z.string(),
  inputType: z.nativeEnum(InputType),
  sourceName: z.string().optional(),
  status: z.string(),
  llmMode: z.nativeEnum(LLMMode),
  summary: z.object({
    decisions: z.array(z.string()),
    risks: z.array(z.string()),
    asks: z.array(z.string()),
    keyPoints: z.array(z.string())
  }).optional(),
  stats: z.object({
    taskCount: z.number(),
    highConfidenceCount: z.number(),
    processingDurationMs: z.number().optional(),
    llmCallCount: z.number().optional()
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  errorMessage: z.string().optional()
});

export type GetRunResponse = z.infer<typeof GetRunResponseSchema>;

/**
 * GET /v1/runs - List runs with pagination
 */
export const ListRunsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  inputType: z.nativeEnum(InputType).optional()
});

export type ListRunsQuery = z.infer<typeof ListRunsQuerySchema>;

// ==================== Upload Endpoints ====================

/**
 * POST /v1/uploads - Upload a file
 */
export const UploadFileResponseSchema = z.object({
  fileId: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  uploadedAt: z.string().datetime()
});

export type UploadFileResponse = z.infer<typeof UploadFileResponseSchema>;

// ==================== Task Endpoints ====================

/**
 * GET /v1/runs/:runId/tasks - Get tasks for a run
 */
export const GetTasksResponseSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    runId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    ownerRaw: z.string().optional(),
    ownerNormalized: z.string().optional(),
    dueDateRaw: z.string().optional(),
    dueDateISO: z.string().optional(),
    priority: z.nativeEnum(Priority).optional(),
    status: z.nativeEnum(TaskStatus),
    confidence: z.number().min(0).max(1),
    sourceQuote: z.string(),
    sourceLocation: z.object({
      page: z.number().optional(),
      section: z.string().optional(),
      paragraphIndex: z.number().optional(),
      lineNumber: z.number().optional()
    }).optional(),
    tags: z.array(z.string()),
    integrationState: z.record(z.any()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })),
  total: z.number()
});

export type GetTasksResponse = z.infer<typeof GetTasksResponseSchema>;

/**
 * PATCH /v1/tasks/:taskId - Update a task
 */
export const UpdateTaskRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ownerNormalized: z.string().optional(),
  dueDateISO: z.string().datetime().optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

// ==================== Export Endpoints ====================

/**
 * POST /v1/runs/:runId/exports - Create export
 */
export const CreateExportRequestSchema = z.object({
  type: z.nativeEnum(ExportType),
  taskIds: z.array(z.string()).optional(), // If not provided, export all tasks
  includeMetadata: z.boolean().default(true)
});

export type CreateExportRequest = z.infer<typeof CreateExportRequestSchema>;

export const CreateExportResponseSchema = z.object({
  exportId: z.string(),
  type: z.nativeEnum(ExportType),
  taskCount: z.number(),
  downloadUrl: z.string(),
  expiresAt: z.string().datetime().optional()
});

export type CreateExportResponse = z.infer<typeof CreateExportResponseSchema>;

// ==================== Integration Endpoints ====================

/**
 * GET /v1/integrations/targets - List integration targets
 */
export const ListIntegrationTargetsResponseSchema = z.object({
  targets: z.array(z.object({
    id: z.string(),
    name: z.nativeEnum(IntegrationName),
    displayName: z.string(),
    isActive: z.boolean(),
    createdAt: z.string().datetime()
  }))
});

export type ListIntegrationTargetsResponse = z.infer<typeof ListIntegrationTargetsResponseSchema>;

/**
 * POST /v1/integrations/targets - Create integration target
 */
export const CreateIntegrationTargetRequestSchema = z.object({
  name: z.nativeEnum(IntegrationName),
  displayName: z.string(),
  config: z.record(z.any()), // Varies by integration type
  isActive: z.boolean().default(true)
});

export type CreateIntegrationTargetRequest = z.infer<typeof CreateIntegrationTargetRequestSchema>;

/**
 * POST /v1/runs/:runId/push - Push tasks to integration
 */
export const PushTasksRequestSchema = z.object({
  targetId: z.string(),
  taskIds: z.array(z.string()), // Tasks to push
  mappingOptions: z.record(z.any()).optional() // Target-specific mapping
});

export type PushTasksRequest = z.infer<typeof PushTasksRequestSchema>;

export const PushTasksResponseSchema = z.object({
  targetId: z.string(),
  results: z.array(z.object({
    taskId: z.string(),
    status: z.string(),
    externalId: z.string().optional(),
    errorMessage: z.string().optional()
  })),
  successCount: z.number(),
  failureCount: z.number()
});

export type PushTasksResponse = z.infer<typeof PushTasksResponseSchema>;

// ==================== Webhook Endpoints ====================

/**
 * POST /v1/webhooks/email - Inbound email webhook
 */
export const WebhookEmailRequestSchema = z.object({
  subject: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  date: z.string().datetime(),
  bodyText: z.string(),
  bodyHtml: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    contentType: z.string(),
    content: z.string() // Base64 encoded
  })).optional()
});

export type WebhookEmailRequest = z.infer<typeof WebhookEmailRequestSchema>;

export const WebhookEmailResponseSchema = z.object({
  runId: z.string(),
  status: z.string(),
  message: z.string()
});

export type WebhookEmailResponse = z.infer<typeof WebhookEmailResponseSchema>;

// ==================== Validation Helpers ====================

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
