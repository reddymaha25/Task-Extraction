import { CandidateTask, Task, StakeholderSummary, MeetingMinutes, ExtractionContext } from '@task-platform/shared';

/**
 * LLM Provider Interface
 * All providers must implement these methods for consistent extraction
 */
export interface LLMProvider {
  /**
   * Extract candidate tasks from input text (Pass A)
   * This is a lenient extraction to find all potential tasks
   * 
   * @param input - The cleaned text to extract from
   * @param context - Extraction context (timezone, reference time, etc.)
   * @returns Array of candidate tasks (may include tasks without quotes)
   */
  extractCandidates(
    input: string,
    context: ExtractionContext
  ): Promise<CandidateTask[]>;

  /**
   * Validate and normalize candidate tasks (Pass B)
   * Strict validation: drops tasks without quotes, normalizes fields
   * 
   * @param candidates - Candidate tasks from Pass A
   * @param context - Extraction context
   * @returns Validated and normalized tasks (guaranteed to have sourceQuote)
   */
  validateAndNormalize(
    candidates: CandidateTask[],
    context: ExtractionContext
  ): Promise<Task[]>;

  /**
   * Generate stakeholder summary from input
   * Extracts decisions, risks, asks, and key points
   * 
   * @param input - The original or cleaned text
   * @param tasks - Extracted tasks (optional, for context)
   * @param context - Extraction context
   * @returns Stakeholder summary
   */
  generateStakeholderSummary(
    input: string,
    tasks: Task[],
    context: ExtractionContext
  ): Promise<StakeholderSummary>;

  /**
   * Extract meeting minutes from input
   * Captures meeting metadata, participants, agenda, and notes
   * 
   * @param input - The original or cleaned text
   * @param context - Extraction context
   * @returns Meeting minutes
   */
  extractMeetingMinutes(
    input: string,
    context: ExtractionContext
  ): Promise<MeetingMinutes>;
}

/**
 * Provider configuration base
 */
export interface ProviderConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeout?: number;
}

/**
 * Open-source provider configuration
 */
export interface OpenSourceConfig extends ProviderConfig {
  baseUrl: string; // e.g., http://localhost:11434
  model: string; // e.g., llama2, mistral
}

/**
 * OpenAI provider configuration
 */
export interface OpenAIConfig extends ProviderConfig {
  apiKey: string;
  model: string; // e.g., gpt-4-turbo-preview
  organization?: string;
}

/**
 * Azure OpenAI provider configuration
 */
export interface AzureOpenAIConfig extends ProviderConfig {
  apiKey: string;
  endpoint: string; // e.g., https://your-resource.openai.azure.com/
  deploymentName: string; // e.g., gpt-4
  apiVersion: string; // e.g., 2024-02-15-preview
}

/**
 * LLM call result
 */
export interface LLMResult<T = any> {
  data: T;
  raw: string;
  tokensUsed?: number;
  durationMs: number;
}
