import OpenAI from 'openai';
import {
  LLMProvider,
  OpenAIConfig,
  LLMResult,
} from '../types';
import {
  CandidateTask,
  Task,
  StakeholderSummary,
  MeetingMinutes,
  ExtractionContext,
  TaskStatus,
  generateCorrelationId,
  retry,
} from '@task-platform/shared';
import {
  SYSTEM_PROMPT,
  generateCandidatePrompt,
  generateValidationPrompt,
  generateSummaryPrompt,
  generateMeetingMinutesPrompt,
} from '../prompts';

/**
 * OpenAI Provider
 * Uses OpenAI API for extraction (optional, requires API key)
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private config: Required<OpenAIConfig>;

  constructor(config: OpenAIConfig) {
    this.config = {
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens ?? 4096,
      topP: config.topP ?? 0.95,
      timeout: config.timeout ?? 60000,
      apiKey: config.apiKey,
      model: config.model,
      organization: config.organization ?? '',
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      timeout: this.config.timeout,
    });
  }

  /**
   * Extract candidate tasks (Pass A)
   */
  async extractCandidates(
    input: string,
    context: ExtractionContext
  ): Promise<CandidateTask[]> {
    const prompt = generateCandidatePrompt(input, context);

    const result = await this.callLLM<any>(prompt, {
      system: SYSTEM_PROMPT,
      temperature: this.config.temperature,
      jsonMode: true,
    });

    // Ensure we always return an array
    const data = result.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.tasks)) {
      return data.tasks;
    } else if (data && typeof data === 'object') {
      return [data];
    }
    return [];
  }

  /**
   * Validate and normalize candidates (Pass B)
   */
  async validateAndNormalize(
    candidates: CandidateTask[],
    context: ExtractionContext
  ): Promise<Task[]> {
    // Filter out candidates without quotes immediately
    const validCandidates = candidates.filter(c => c.sourceQuote && c.sourceQuote.trim().length > 0);

    if (validCandidates.length === 0) {
      return [];
    }

    const prompt = generateValidationPrompt(validCandidates, context);

    const result = await this.callLLM<any>(prompt, {
      system: SYSTEM_PROMPT,
      temperature: this.config.temperature * 0.8,
      jsonMode: true,
    });

    // Ensure we have an array
    let tasks: any[];
    const data = result.data;
    if (Array.isArray(data)) {
      tasks = data;
    } else if (data && Array.isArray(data.tasks)) {
      tasks = data.tasks;
    } else if (data && typeof data === 'object') {
      tasks = [data];
    } else {
      tasks = [];
    }

    // Convert to Task objects
    return tasks
      .filter(t => t && t.sourceQuote)
      .map(t => ({
        id: '',
        runId: '',
        title: t.title || 'Untitled Task',
        description: t.description || undefined,
        ownerRaw: t.owner || undefined,
        ownerNormalized: undefined,
        dueDateRaw: t.dueDate || undefined,
        dueDateISO: undefined,
        priority: t.priority || undefined,
        status: (t.status as TaskStatus) || TaskStatus.NEW,
        confidence: Math.max(0, Math.min(1, t.confidence || 0.5)),
        sourceQuote: t.sourceQuote,
        sourceLocation: undefined,
        tags: t.tags || [],
        integrationState: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  }

  /**
   * Generate stakeholder summary
   */
  async generateStakeholderSummary(
    input: string,
    tasks: Task[],
    context: ExtractionContext
  ): Promise<StakeholderSummary> {
    const prompt = generateSummaryPrompt(input, tasks, context);

    const result = await this.callLLM<StakeholderSummary>(prompt, {
      system: 'You are an expert at analyzing meeting notes and emails to extract key insights.',
      temperature: this.config.temperature,
      jsonMode: true,
    });

    return {
      decisions: result.data.decisions || [],
      risks: result.data.risks || [],
      asks: result.data.asks || [],
      keyPoints: result.data.keyPoints || [],
    };
  }

  /**
   * Extract meeting minutes
   */
  async extractMeetingMinutes(
    input: string,
    context: ExtractionContext
  ): Promise<MeetingMinutes> {
    const prompt = generateMeetingMinutesPrompt(input);

    const result = await this.callLLM<MeetingMinutes>(prompt, {
      system: SYSTEM_PROMPT,
      temperature: this.config.temperature,
      jsonMode: true,
    });

    console.log(`✅ Extracted meeting minutes: ${result.data.participants?.length || 0} participants, ${result.data.agenda?.length || 0} agenda items`);

    return {
      title: result.data.title,
      date: result.data.date,
      participants: result.data.participants || [],
      agenda: result.data.agenda || [],
      notes: result.data.notes,
      nextSteps: result.data.nextSteps || [],
    };
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callLLM<T>(
    prompt: string,
    options: {
      system?: string;
      temperature?: number;
      jsonMode?: boolean;
    } = {}
  ): Promise<LLMResult<T>> {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();

    const execute = async (): Promise<LLMResult<T>> => {
      try {
        const response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
            { role: 'user' as const, content: prompt },
          ],
          temperature: options.temperature ?? this.config.temperature,
          top_p: this.config.topP,
          max_tokens: this.config.maxTokens,
          response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        });

        const raw = response.choices[0]?.message?.content || '';
        const parsed: T = JSON.parse(raw);

        return {
          data: parsed,
          raw,
          tokensUsed: response.usage?.total_tokens,
          durationMs: Date.now() - startTime,
        };
      } catch (error: any) {
        console.error(`[${correlationId}] OpenAI call failed:`, error.message);
        throw error;
      }
    };

    // Retry with exponential backoff
    return retry(execute, {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    });
  }
}

/**
 * Factory function to create OpenAIProvider
 */
export function createOpenAIProvider(config: OpenAIConfig): LLMProvider {
  return new OpenAIProvider(config);
}
