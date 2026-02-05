import { InputType, RunStatus, LLMMode, Priority, TaskStatus, IntegrationName, SyncStatus, ExportType } from './enums';

/**
 * Core domain types representing the business entities
 */

/**
 * Extraction Run
 * Represents a single extraction operation on input content
 */
export interface Run {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Optional user ID
  inputType: InputType;
  sourceName?: string; // Filename or webhook source identifier
  referenceTime: Date; // Timestamp for resolving relative dates ("next Friday")
  timezone: string; // IANA timezone (e.g., "America/New_York")
  status: RunStatus;
  llmMode: LLMMode;
  summary?: StakeholderSummary;
  meetingMinutes?: MeetingMinutes;
  stats: RunStats;
  errorMessage?: string;
}

/**
 * Statistics for a run
 */
export interface RunStats {
  taskCount: number;
  highConfidenceCount: number;
  processingDurationMs?: number;
  llmCallCount?: number;
}

/**
 * Uploaded or processed document
 */
export interface Document {
  id: string;
  runId: string;
  mimeType: string;
  originalName: string;
  storagePath: string; // File system path or blob reference
  extractedText?: string; // May be stored separately for large documents
  contentHash: string; // SHA256 for deduplication
  sizeBytes: number;
  pageCount?: number; // For PDFs
  createdAt: Date;
}

/**
 * Extracted Task
 * Every task MUST have a sourceQuote for traceability
 */
export interface Task {
  id: string;
  runId: string;
  title: string;
  description?: string;
  ownerRaw?: string; // As extracted from source (e.g., "Rayan", "Alex")
  ownerNormalized?: string; // Email or user ID (optional)
  dueDateRaw?: string; // As extracted (e.g., "next Friday", "Feb 10")
  dueDateISO?: string; // Resolved ISO 8601 date
  priority?: Priority;
  status: TaskStatus;
  confidence: number; // 0-1, based on extraction quality
  sourceQuote: string; // REQUIRED: The exact text from source
  sourceLocation?: SourceLocation; // Where in the document
  tags: string[];
  integrationState: Record<string, TaskIntegrationState>; // Per-target sync state
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Location of task in source document
 */
export interface SourceLocation {
  page?: number; // For PDFs
  section?: string; // For structured documents
  paragraphIndex?: number; // For emails/text
  lineNumber?: number;
}

/**
 * Integration sync state for a task
 */
export interface TaskIntegrationState {
  externalId?: string; // ID in the external system
  syncStatus?: SyncStatus;
  lastSyncedAt?: Date;
  errorMessage?: string;
}

/**
 * Stakeholder Summary
 * High-level insights extracted from the content
 */
export interface StakeholderSummary {
  decisions: string[]; // Key decisions made
  risks: string[]; // Identified risks or blockers
  asks: string[]; // Questions or requests for input
  keyPoints: string[]; // Other important points
}

/** * Meeting Minutes
 * Structured meeting information extracted from input
 */
export interface MeetingMinutes {
  title?: string; // Meeting title/subject
  date?: Date; // Meeting date/time
  participants: string[]; // List of attendees
  agenda: string[]; // Meeting agenda items
  notes?: string; // General meeting notes/discussion
  nextSteps: string[]; // Follow-up actions or next steps
}

/** * Integration Target Configuration
 */
export interface IntegrationTarget {
  id: string;
  name: IntegrationName;
  displayName: string;
  config: IntegrationConfig; // Encrypted at rest
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Integration configuration (varies by target)
 */
export interface IntegrationConfig {
  // Jira
  baseUrl?: string;
  email?: string;
  apiToken?: string;
  projectKey?: string;

  // Asana
  accessToken?: string;
  workspaceId?: string;
  projectId?: string;

  // Planner
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  planId?: string;

  // Microsoft To Do
  // accessToken is shared with other Microsoft integrations

  // Generic Webhook
  webhookUrl?: string;
  webhookSecret?: string;
  customHeaders?: Record<string, string>;

  // Legacy support
  headers?: Record<string, string>;
}

/**
 * Task Sync Result
 * Result of pushing a task to an external system
 */
export interface TaskSyncResult {
  id: string;
  taskId: string;
  targetId: string;
  externalId?: string; // Created issue/task ID in external system
  status: SyncStatus;
  errorMessage?: string;
  syncedAt: Date;
}

/**
 * Export Artifact
 * Generated export file metadata
 */
export interface ExportArtifact {
  id: string;
  runId: string;
  type: ExportType;
  path: string; // File system path
  sizeBytes: number;
  taskCount: number;
  createdAt: Date;
  expiresAt?: Date; // Optional expiration for cleanup
}

/**
 * Parsed Document
 * Output from file parsers before extraction
 */
export interface ParsedDocument {
  text: string;
  sections?: DocumentSection[];
  metadata: DocumentMetadata;
}

/**
 * Document section (e.g., from headings)
 */
export interface DocumentSection {
  title: string;
  content: string;
  startOffset: number;
  endOffset: number;
  level?: number; // Heading level
  page?: number;
}

/**
 * Document parsing metadata
 */
export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  hasImages?: boolean;
  language?: string;
  author?: string;
  subject?: string;
  createdDate?: Date;
  threadMetadata?: {
    messageCount: number;
    participants: string[];
    threadingComplete: boolean;
    isSingleMessage: boolean;
  };
}

/**
 * Candidate Task (before validation)
 * Output from initial LLM extraction pass
 */
export interface CandidateTask {
  title: string;
  description?: string;
  owner?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  sourceQuote?: string;
  sourceOffset?: number;
  rawConfidence?: number;
}

/**
 * Extraction Context
 * Metadata passed to LLM for better extraction
 */
export interface ExtractionContext {
  referenceTime: Date;
  timezone: string;
  inputType: InputType;
  sourceName?: string;
  documentMetadata?: DocumentMetadata;
}
