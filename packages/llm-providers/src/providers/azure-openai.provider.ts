import { AzureOpenAI } from 'openai';
import {
  LLMProvider,
  AzureOpenAIConfig,
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
 * Azure OpenAI Provider
 * Uses Azure OpenAI API for extraction
 */
export class AzureOpenAIProvider implements LLMProvider {
  private client: AzureOpenAI;
  private config: Required<AzureOpenAIConfig>;

  constructor(config: AzureOpenAIConfig) {
    this.config = {
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens ?? 4096,
      topP: config.topP ?? 0.95,
      timeout: config.timeout ?? 60000,
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      deploymentName: config.deploymentName,
      apiVersion: config.apiVersion,
    };

    this.client = new AzureOpenAI({
      apiKey: this.config.apiKey,
      endpoint: this.config.endpoint,
      apiVersion: this.config.apiVersion,
      deployment: this.config.deploymentName,
    });

    console.log(`🔧 Azure OpenAI configured:`, {
      endpoint: this.config.endpoint,
      deployment: this.config.deploymentName,
      apiVersion: this.config.apiVersion,
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
    });

    console.log('🔍 Raw candidates response:', JSON.stringify(result.data).substring(0, 500));

    // Ensure we always return an array
    const data = result.data;
    if (Array.isArray(data)) {
      console.log(`📋 Extracted ${data.length} candidates (array format)`);
      return data;
    } else if (data && Array.isArray(data.tasks)) {
      console.log(`📋 Extracted ${data.tasks.length} candidates (tasks property)`);
      return data.tasks;
    } else if (data && typeof data === 'object') {
      // If it's a single task object, wrap it
      console.log(`📋 Extracted 1 candidate (single object)`);
      return [data];
    }
    console.log('⚠️  No candidates found in response');
    return [];
  }

  /**
   * Validate and normalize tasks (Pass B)
   */
  async validateAndNormalize(
    candidates: CandidateTask[],
    context: ExtractionContext
  ): Promise<Task[]> {
    // Filter out candidates without source quotes
    const validCandidates = candidates.filter(c => c.sourceQuote);

    console.log(`🔍 Validating ${candidates.length} candidates, ${validCandidates.length} have sourceQuote`);

    if (validCandidates.length === 0) {
      console.log('⚠️  No candidates with sourceQuote found');
      return [];
    }

    const prompt = generateValidationPrompt(validCandidates, context);

    const result = await this.callLLM<any>(prompt, {
      system: SYSTEM_PROMPT,
      temperature: this.config.temperature * 0.8, // Lower temp for validation
    });

    console.log('🔍 Raw validation response:', JSON.stringify(result.data).substring(0, 500));

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

    console.log(`📋 Validated ${tasks.length} tasks before filtering`);

    // Convert to Task objects
    const finalTasks = tasks
      .filter((t: any) => t && t.sourceQuote) // Double-check
      .map((t: any) => ({
        id: '', // Will be assigned by repository
        runId: '', // Will be assigned by service
        title: t.title || 'Untitled Task',
        description: t.description || undefined,
        ownerRaw: t.owner || undefined,
        ownerNormalized: undefined,
        dueDateRaw: t.dueDate || undefined,
        dueDateISO: undefined, // Will be resolved by service
        priority: t.priority || 'P2',
        status: TaskStatus.NEW,
        confidence: t.confidence ?? 0.8,
        sourceQuote: t.sourceQuote,
        sourceLocation: t.sourceLocation || undefined,
        tags: t.tags || [],
        integrationState: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    console.log(`✅ Returning ${finalTasks.length} validated tasks with sourceQuote`);
    return finalTasks;
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
      system: SYSTEM_PROMPT,
      temperature: this.config.temperature,
    });

    console.log('🔍 Raw summary response:', JSON.stringify(result.data).substring(0, 500));

    const summary = {
      decisions: result.data.decisions || [],
      risks: result.data.risks || [],
      asks: result.data.asks || [],
      keyPoints: result.data.keyPoints || [],
    };

    console.log(`📊 Generated summary: ${summary.decisions.length} decisions, ${summary.risks.length} risks, ${summary.asks.length} asks, ${summary.keyPoints.length} key points`);

    return summary;
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
      system: 'You are an expert at extracting meeting information from text. Extract meeting details and return valid JSON only.',
      temperature: this.config.temperature,
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
   * Call Azure OpenAI API with retry logic
   */
  private async callLLM<T>(
    prompt: string,
    options: {
      system: string;
      temperature: number;
    }
  ): Promise<LLMResult<T>> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    const makeRequest = async () => {
      console.log(`[${correlationId}] Calling Azure OpenAI deployment: ${this.config.deploymentName}`);
      
      const response = await this.client.chat.completions.create({
        model: this.config.deploymentName,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: prompt },
        ],
        // Note: gpt-5-mini only supports default temperature (1)
        // temperature: options.temperature,
        max_completion_tokens: this.config.maxTokens,
        // top_p is also often unsupported
        // top_p: this.config.topP,
        // JSON object mode disabled - gpt-5-mini doesn't support it properly
        // response_format: { type: 'json_object' },
      });

      return response;
    };

    try {
      const response = await retry(makeRequest, { maxAttempts: 3, initialDelayMs: 1000 });

      const content = response.choices[0]?.message?.content || '{}';
      const durationMs = Date.now() - startTime;

      console.log(`[${correlationId}] Response received in ${durationMs}ms, ${response.usage?.total_tokens} tokens`);
      console.log(`[${correlationId}] Raw content (first 1000 chars):`, content.substring(0, 1000));

      // Check if response is empty or just whitespace
      if (!content || content.trim() === '' || content.trim() === '{}' || content.trim() === '[]') {
        console.error(`[${correlationId}] ⚠️  Empty response from Azure OpenAI - retrying...`);
        throw new Error('Empty response from Azure OpenAI');
      }

      let parsed: T;
      try {
        parsed = JSON.parse(content);
        
        // Azure OpenAI returns objects, so we need to extract arrays from wrapper objects
        if ((parsed as any).error) {
          // Azure complained about format - log and try to extract anyway
          console.log(`⚠️  Azure returned error: ${(parsed as any).error}`);
        }
        
        // Handle wrapped response - look for common wrapper properties
        if ((parsed as any).tasks && Array.isArray((parsed as any).tasks)) {
          parsed = (parsed as any).tasks as T;
        } else if ((parsed as any).summary) {
          parsed = (parsed as any).summary as T;
        } else if ((parsed as any).data && Array.isArray((parsed as any).data)) {
          parsed = (parsed as any).data as T;
        } else if ((parsed as any).result && Array.isArray((parsed as any).result)) {
          parsed = (parsed as any).result as T;
        }
        // For StakeholderSummary specifically, extract arrays from the object
        else if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null && 
                 ((parsed as any).decisions || (parsed as any).risks || (parsed as any).asks || (parsed as any).keyPoints)) {
          // This is a StakeholderSummary - keep as object, don't extract arrays
          // Just validate it has the expected structure
        }
        // For objects with single array property (but NOT meeting minutes which has multiple properties)
        else if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null &&
                 !(parsed as any).participants && !(parsed as any).agenda && !(parsed as any).nextSteps) {
          // Try to find first array property (for legacy response formats)
          const keys = Object.keys(parsed);
          for (const key of keys) {
            if (Array.isArray((parsed as any)[key])) {
              console.log(`🔄 Extracting array from property: ${key}`);
              parsed = (parsed as any)[key] as T;
              break;
            }
          }
        }
      } catch (parseError) {
        console.error(`[${correlationId}] Failed to parse JSON:`, content.substring(0, 500));
        throw new Error('Failed to parse LLM response as JSON');
      }

      return {
        data: parsed,
        raw: content,
        tokensUsed: response.usage?.total_tokens,
        durationMs,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const errorCode = error.code;
      const status = error.status;
      
      console.error(`[${correlationId}] Azure OpenAI API error:`, {
        message: errorMessage,
        code: errorCode,
        status: status,
        deployment: this.config.deploymentName,
      });
      
      if (status === 401) {
        throw new Error('Azure OpenAI authentication failed. Please check your API key.');
      } else if (status === 404) {
        throw new Error(`Azure OpenAI deployment '${this.config.deploymentName}' not found. Please check your deployment name.`);
      } else if (status === 429) {
        throw new Error('Azure OpenAI rate limit exceeded. Please try again later.');
      } else if (errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Azure OpenAI endpoint: ${this.config.endpoint}`);
      }
      
      throw new Error(`Azure OpenAI API error: ${errorMessage}`);
    }
  }
}

/**
 * Factory function to create Azure OpenAI provider
 */
export function createAzureOpenAIProvider(config: AzureOpenAIConfig): LLMProvider {
  return new AzureOpenAIProvider(config);
}
