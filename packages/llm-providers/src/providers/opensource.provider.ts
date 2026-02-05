import axios, { AxiosInstance } from 'axios';
import {
  LLMProvider,
  OpenSourceConfig,
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
 * Open-source LLM Provider
 * Connects to local LLM server (e.g., Ollama, LM Studio, vLLM)
 */
export class OpenSourceProvider implements LLMProvider {
  private client: AxiosInstance;
  private config: Required<OpenSourceConfig>;

  constructor(config: OpenSourceConfig) {
    this.config = {
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens ?? 4096,
      topP: config.topP ?? 0.95,
      timeout: config.timeout ?? 60000,
      baseUrl: config.baseUrl,
      model: config.model,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if the LLM server is accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/tags', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error(`Failed to connect to LLM server at ${this.config.baseUrl}:`, error instanceof Error ? error.message : error);
      return false;
    }
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
      temperature: this.config.temperature * 0.8, // Lower temp for validation
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
      .filter((t: any) => t && t.sourceQuote) // Double-check
      .map((t: any) => ({
        id: '', // Will be assigned by repository
        runId: '', // Will be assigned by service
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
   * Extract meeting minutes from input
   */
  async extractMeetingMinutes(
    input: string,
    context: ExtractionContext
  ): Promise<MeetingMinutes> {
    const prompt = generateMeetingMinutesPrompt(input);

    const result = await this.callLLM<MeetingMinutes>(prompt, {
      system: 'You are an expert at extracting meeting information from notes and emails. Return valid JSON only.',
      temperature: this.config.temperature,
      jsonMode: true,
    });

    console.log('📝 Raw meeting minutes response:', JSON.stringify(result.data).substring(0, 1000));

    // Handle the response - it should be an object, not an array
    const data = result.data;
    const minutes: MeetingMinutes = {
      title: data.title || undefined,
      date: data.date ? new Date(data.date) : undefined,
      participants: Array.isArray(data.participants) ? data.participants : [],
      agenda: Array.isArray(data.agenda) ? data.agenda : [],
      notes: data.notes || undefined,
      nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps : [],
    };

    console.log(`📋 Meeting minutes extracted: ${minutes.participants.length} participants, ${minutes.agenda.length} agenda items, title: ${minutes.title || 'none'}`);

    return minutes;
  }

  /**
   * Call LLM with retry logic
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
        console.log(`[${correlationId}] Calling LLM at ${this.config.baseUrl} with model ${this.config.model}`);
        
        // Ollama API format (adjust for your local LLM server)
        const response = await this.client.post('/api/generate', {
          model: this.config.model,
          prompt: options.system ? `${options.system}\n\n${prompt}` : prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? this.config.temperature,
            top_p: this.config.topP,
            num_predict: this.config.maxTokens,
          },
          format: options.jsonMode ? 'json' : undefined,
        });

        const raw = response.data.response;
        let parsed: T;

        if (options.jsonMode) {
          // Parse JSON response
          try {
            parsed = JSON.parse(raw);
          } catch (err) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[1]);
            } else {
              throw new Error(`Failed to parse JSON response: ${raw.substring(0, 200)}`);
            }
          }
        } else {
          parsed = raw as T;
        }

        return {
          data: parsed,
          raw,
          tokensUsed: response.data.eval_count,
          durationMs: Date.now() - startTime,
        };
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        const statusCode = error.response?.status;
        
        if (error.code === 'ECONNREFUSED') {
          throw new Error(`Cannot connect to LLM server at ${this.config.baseUrl}. Please ensure Ollama is running (try 'ollama serve' or start Ollama app).`);
        } else if (statusCode === 404) {
          throw new Error(`Model '${this.config.model}' not found. Please pull it first: ollama pull ${this.config.model}`);
        }
        
        console.error(`[${correlationId}] LLM call failed:`, errorMessage);
        throw new Error(`LLM call failed: ${errorMessage}`);
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
 * Factory function to create OpenSourceProvider
 */
export function createOpenSourceProvider(config: OpenSourceConfig): LLMProvider {
  return new OpenSourceProvider(config);
}
