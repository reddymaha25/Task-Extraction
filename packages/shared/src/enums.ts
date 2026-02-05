/**
 * Input types for extraction runs
 */
export enum InputType {
  TEXT = 'TEXT',
  PDF = 'PDF',
  DOCX = 'DOCX',
  EML = 'EML',
  WEBHOOK = 'WEBHOOK'
}

/**
 * Run processing status
 */
export enum RunStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

/**
 * LLM provider mode
 */
export enum LLMMode {
  OPEN_SOURCE = 'OPEN_SOURCE',
  OPENAI = 'OPENAI',
  AZURE_OPENAI = 'AZURE_OPENAI'
}

/**
 * Task priority levels
 */
export enum Priority {
  P0 = 'P0', // Critical
  P1 = 'P1', // High
  P2 = 'P2', // Medium
  P3 = 'P3'  // Low
}

/**
 * Task status
 */
export enum TaskStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Export artifact types
 */
export enum ExportType {
  XLSX = 'XLSX',
  CSV = 'CSV',
  JSON = 'JSON'
}

/**
 * Integration target systems
 */
export enum IntegrationName {
  JIRA = 'JIRA',
  ASANA = 'ASANA',
  PLANNER = 'PLANNER',
  CUSTOM_WEBHOOK = 'CUSTOM_WEBHOOK',
  MICROSOFT_TODO = 'MICROSOFT_TODO',
  WEBHOOK = 'WEBHOOK'
}

/**
 * Task sync status with external systems
 */
export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}
