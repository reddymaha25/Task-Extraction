import { Router, Request, Response } from 'express';
import { createRunRepository, createTaskRepository } from '@task-platform/db';
import { ExtractionService } from '@task-platform/extraction';
import { createLLMProvider, autoSelectLLM } from '@task-platform/llm-providers';
import { 
  CreateRunRequestSchema, 
  validateSchema,
  InputType,
  RunStatus 
} from '@task-platform/shared';
import { config } from '../config';
import { AppError } from '../middleware/error.middleware';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

/**
 * POST /api/v1/runs - Create a new extraction run
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    console.log('📥 Create run request body:', JSON.stringify(req.body, null, 2));
    
    // Validate request
    const validation = validateSchema(CreateRunRequestSchema, req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const data = validation.data;
    console.log('✅ Validated data:', JSON.stringify(data, null, 2));
    
    const runRepo = createRunRepository();

    // Auto-select the best available LLM provider
    const selectedLLM = autoSelectLLM({
      azureOpenai: config.azureOpenai,
      openai: config.openai,
      openSource: config.openLLM,
      defaultProvider: config.defaultLLMProvider,
    });

    // Create run in database
    const run = await runRepo.create({
      inputType: data.inputType,
      sourceName: data.sourceName,
      referenceTime: data.referenceTime ? new Date(data.referenceTime) : new Date(),
      timezone: data.timezone,
      llmMode: selectedLLM,
    });

    res.status(201).json({
      runId: run.id,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/runs/:runId/process - Process a run
 */
router.post('/:runId/process', async (req: Request, res: Response, next) => {
  try {
    const { runId } = req.params;
    console.log(`📊 Processing run ${runId}...`);
    console.log(`📥 Request body:`, JSON.stringify(req.body, null, 2));
    
    const runRepo = createRunRepository();
    const taskRepo = createTaskRepository();

    // Get run
    const run = await runRepo.findById(runId);
    if (!run) {
      throw new AppError(404, 'Run not found');
    }

    console.log(`✅ Run found: ${run.inputType}, LLM mode: ${run.llmMode}`);

    // Update status to PROCESSING
    await runRepo.updateStatus(runId, RunStatus.PROCESSING);

    // Create LLM provider
    console.log(`🤖 Creating LLM provider for mode: ${run.llmMode}`);
    const llmProvider = createLLMProvider(run.llmMode, {
      openSource: config.openLLM,
      openai: config.openai,
      azureOpenai: config.azureOpenai,
    });

    // Create extraction service
    const extractionService = new ExtractionService(llmProvider, {
      parseEmailThreads: config.parseEmailThreads,
    });

    // Prepare input
    let text: string | undefined;
    let fileBuffer: Buffer | undefined;
    let fileBuffers: Buffer[] | undefined;

    if (run.inputType === InputType.TEXT) {
      text = req.body.text;
      if (!text) {
        throw new AppError(400, 'Text required for TEXT input type');
      }
      console.log(`📝 Processing text input (${text.length} characters)`);
    } else {
      // Check if multiple files (fileIds) or single file (fileId)
      const fileIds = req.body.fileIds;
      const singleFileId = req.body.fileId;
      
      if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
        // Multiple files - load all
        console.log(`📚 Loading ${fileIds.length} files...`);
        fileBuffers = [];
        for (const fileId of fileIds) {
          const filePath = path.join(config.uploadDir, fileId);
          console.log(`📄 Loading file: ${filePath}`);
          const buffer = await fs.readFile(filePath);
          fileBuffers.push(buffer);
          console.log(`  ✅ File loaded (${buffer.length} bytes)`);
        }
        console.log(`✅ All ${fileBuffers.length} files loaded`);
      } else if (singleFileId) {
        // Single file - backward compatibility
        const filePath = path.join(config.uploadDir, singleFileId);
        console.log(`📄 Loading file: ${filePath}`);
        fileBuffer = await fs.readFile(filePath);
        console.log(`✅ File loaded (${fileBuffer.length} bytes)`);
      } else {
        throw new AppError(400, 'fileId or fileIds required for file input types');
      }
    }

    // Process run
    console.log(`🔄 Starting extraction...`);
    
    let result;
    if (fileBuffers && fileBuffers.length > 0) {
      // Process multiple files - merge all tasks
      console.log(`🔄 Processing ${fileBuffers.length} files...`);
      const allTasks: any[] = [];
      let totalStats = { processingDurationMs: 0, llmCallCount: 0 };
      
      for (let i = 0; i < fileBuffers.length; i++) {
        console.log(`  📄 Processing file ${i + 1}/${fileBuffers.length}...`);
        const fileResult = await extractionService.processRun({
          runId,
          inputType: run.inputType as InputType,
          fileBuffer: fileBuffers[i],
          referenceTime: run.referenceTime,
          timezone: run.timezone,
          sourceName: run.sourceName,
        });
        allTasks.push(...fileResult.tasks);
        totalStats.processingDurationMs += fileResult.stats.processingDurationMs;
        totalStats.llmCallCount += fileResult.stats.llmCallCount;
        console.log(`  ✅ File ${i + 1} complete: ${fileResult.tasks.length} tasks`);
      }
      
      result = {
        tasks: allTasks,
        stats: totalStats,
        summary: { decisions: [], risks: [], asks: [], keyPoints: [] }, // Will be populated if needed
      };
      console.log(`✅ All files processed: ${allTasks.length} total tasks from ${fileBuffers.length} files`);
    } else {
      // Single file or text
      result = await extractionService.processRun({
        runId,
        inputType: run.inputType as InputType,
        text,
        fileBuffer,
        referenceTime: run.referenceTime,
        timezone: run.timezone,
        sourceName: run.sourceName,
      });
    }

    console.log(`✅ Extraction complete: ${result.tasks.length} tasks found`);

    // Save tasks - convert dueDateISO string to Date
    const tasksToSave = result.tasks.map(t => ({
      ...t,
      dueDateISO: t.dueDateISO ? new Date(t.dueDateISO) : undefined,
    }));
    await taskRepo.createMany(tasksToSave);

    // Update run with results
    await runRepo.updateStatus(
      runId,
      RunStatus.COMPLETE,
      {
        taskCount: result.tasks.length,
        highConfidenceCount: result.tasks.filter(t => t.confidence >= 0.8).length,
        processingDurationMs: result.stats.processingDurationMs,
        llmCallCount: result.stats.llmCallCount,
      }
    );

    await runRepo.updateSummary(runId, result.summary);

    // Save meeting minutes if extracted
    if (result.meetingMinutes) {
      await runRepo.updateMeetingMinutes(runId, result.meetingMinutes);
    }

    res.json({
      runId,
      status: RunStatus.COMPLETE,
      taskCount: result.tasks.length,
      processingTimeMs: result.stats.processingDurationMs,
    });
  } catch (error) {
    // Update run status to FAILED
    console.error(`❌ Run processing failed:`, error);
    try {
      await createRunRepository().updateStatus(
        req.params.runId,
        RunStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (updateError) {
      console.error('Failed to update run status:', updateError);
    }
    next(error);
  }
});

/**
 * GET /api/v1/runs/:runId - Get run details
 */
router.get('/:runId', async (req: Request, res: Response, next) => {
  try {
    const { runId } = req.params;
    const runRepo = createRunRepository();
    const run = await runRepo.findById(runId);

    if (!run) {
      throw new AppError(404, 'Run not found');
    }

    res.json({
      id: run.id,
      inputType: run.inputType,
      sourceName: run.sourceName,
      status: run.status,
      llmMode: run.llmMode,
      summary: run.summary,
      meetingMinutes: run.meetingMinutes,
      stats: run.stats,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      errorMessage: run.errorMessage,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/runs - List runs
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const runRepo = createRunRepository();
    const result = await runRepo.list({
      page,
      limit,
      status: req.query.status as string,
      inputType: req.query.inputType as string,
    });

    res.json({
      runs: result.runs.map(run => ({
        id: run.id,
        inputType: run.inputType,
        sourceName: run.sourceName,
        status: run.status,
        taskCount: run.stats.taskCount,
        createdAt: run.createdAt.toISOString(),
      })),
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

export const runRoutes = router;
