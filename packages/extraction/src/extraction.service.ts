import { 
  Task, 
  ExtractionContext, 
  InputType,
  StakeholderSummary,
  MeetingMinutes,
  ParsedDocument 
} from '@task-platform/shared';
import { LLMProvider } from '@task-platform/llm-providers';
import { getParser, createEMLParser } from '@task-platform/parsers';
import { cleanText, chunkText, resolveDate, calculateConfidence } from './utils';
import { deduplicateTasks } from './deduplication';

/**
 * Extraction Service
 * Orchestrates the full extraction pipeline
 */
export class ExtractionService {
  constructor(
    private llmProvider: LLMProvider,
    private options: { parseEmailThreads?: boolean } = {}
  ) {}

  /**
   * Process a run: parse, extract, validate, dedupe
   */
  async processRun(input: {
    runId: string;
    inputType: InputType;
    text?: string;
    fileBuffer?: Buffer;
    referenceTime: Date;
    timezone: string;
    sourceName?: string;
  }): Promise<{
    tasks: Task[];
    summary: StakeholderSummary;
    meetingMinutes?: MeetingMinutes;
    stats: {
      processingDurationMs: number;
      llmCallCount: number;
    };
  }> {
    const startTime = Date.now();
    let llmCallCount = 0;

    // Step 1: Parse input to text
    const parsed = await this.parseInput(input);
    const rawText = parsed.text;

    // Step 2: Clean text
    const cleanedText = cleanText(rawText);

    // Step 3: Create extraction context
    const context: ExtractionContext = {
      referenceTime: input.referenceTime,
      timezone: input.timezone,
      inputType: input.inputType,
      sourceName: input.sourceName,
      documentMetadata: parsed.metadata,
    };

    // Step 4: Chunk if needed (for very long documents)
    const chunks = chunkText(cleanedText, {
      maxChunkSize: 4000,
      overlap: 200,
    });

    // Step 5: Extract candidates from all chunks
    const allCandidates = [];
    for (const chunk of chunks) {
      llmCallCount++;
      const candidates = await this.llmProvider.extractCandidates(chunk.text, context);
      allCandidates.push(...candidates);
    }

    // Step 6: Validate and normalize
    llmCallCount++;
    let tasks = await this.llmProvider.validateAndNormalize(allCandidates, context);

    // Step 7: Post-processing
    tasks = tasks.map(task => this.postProcessTask(task, input.runId, context));

    // Step 8: Deduplicate
    tasks = deduplicateTasks(tasks);

    // Step 9: Generate summary
    llmCallCount++;
    const summary = await this.llmProvider.generateStakeholderSummary(
      cleanedText,
      tasks,
      context
    );

    // Step 10: Extract meeting minutes
    llmCallCount++;
    const meetingMinutes = await this.llmProvider.extractMeetingMinutes(
      cleanedText,
      context
    );

    return {
      tasks,
      summary,
      meetingMinutes,
      stats: {
        processingDurationMs: Date.now() - startTime,
        llmCallCount,
      },
    };
  }

  /**
   * Parse input based on type
   */
  private async parseInput(input: {
    inputType: InputType;
    text?: string;
    fileBuffer?: Buffer;
  }): Promise<ParsedDocument> {
    if (input.inputType === InputType.TEXT) {
      if (!input.text) {
        throw new Error('Text input required for TEXT input type');
      }
      return {
        text: input.text,
        metadata: {
          wordCount: input.text.split(/\s+/).length,
        },
      };
    }

    if (!input.fileBuffer) {
      throw new Error('File buffer required for file input types');
    }
// Use thread-aware parsing for EML files if enabled
    if (input.inputType === InputType.EML && this.options.parseEmailThreads) {
      const emlParser = createEMLParser({ parseThreads: true });
      return emlParser.parse(input.fileBuffer);
    }

    
    const parser = getParser(input.inputType);
    return parser.parse(input.fileBuffer);
  }

  /**
   * Post-process a task: resolve dates, calculate confidence, assign runId
   */
  private postProcessTask(
    task: Task,
    runId: string,
    context: ExtractionContext
  ): Task {
    // Assign runId
    task.runId = runId;

    // Resolve relative dates
    if (task.dueDateRaw && !task.dueDateISO) {
      task.dueDateISO = resolveDate(
        task.dueDateRaw,
        context.referenceTime,
        context.timezone
      ) || undefined;
    }

    // Recalculate confidence based on final fields
    task.confidence = calculateConfidence({
      title: task.title,
      ownerRaw: task.ownerRaw,
      dueDateRaw: task.dueDateRaw,
      sourceQuote: task.sourceQuote,
    });

    return task;
  }
}
