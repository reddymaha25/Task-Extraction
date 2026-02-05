import { Router, Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { createRunRepository, createTaskRepository } from '@task-platform/db';
import { exportTasks } from '@task-platform/exporters';
import { CreateExportRequestSchema, validateSchema, ExportType, generateCorrelationId } from '@task-platform/shared';
import { config } from '../config';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * POST /api/v1/runs/:runId/exports - Create export
 */
router.post('/:runId/exports', async (req: Request, res: Response, next) => {
  try {
    const { runId } = req.params;
    console.log(`📤 Creating export for run ${runId}, type: ${req.body.type}`);

    const validation = validateSchema(CreateExportRequestSchema, req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const data = validation.data;
    const runRepo = createRunRepository();
    const taskRepo = createTaskRepository();

    // Get run
    const run = await runRepo.findById(runId);
    if (!run) {
      throw new AppError(404, 'Run not found');
    }

    // Get tasks
    let tasks = await taskRepo.findByRunId(runId);

    // Filter by taskIds if provided
    if (data.taskIds && data.taskIds.length > 0) {
      tasks = tasks.filter(t => data.taskIds!.includes(t.id));
    }

    if (tasks.length === 0) {
      throw new AppError(400, 'No tasks to export');
    }

    // Generate export
    await fs.mkdir(config.exportDir, { recursive: true });

    const exportId = generateCorrelationId();
    const extension = data.type === ExportType.XLSX ? 'xlsx' : data.type === ExportType.CSV ? 'csv' : 'json';
    const fileName = `export-${exportId}.${extension}`;
    const outputPath = path.join(config.exportDir, fileName);

    const result = await exportTasks(data.type, tasks, outputPath, {
      run: data.includeMetadata ? run : undefined,
      summary: data.includeMetadata ? run.summary : undefined,
    });

    console.log(`✅ Export created: ${fileName} (${tasks.length} tasks)`);

    res.json({
      exportId,
      type: data.type,
      taskCount: tasks.length,
      downloadUrl: `/api/v1/exports/${exportId}/download`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  } catch (error) {
    console.error('Export error:', error);
    next(error);
  }
});

/**
 * GET /api/v1/exports/:exportId/download - Download export
 */
router.get('/:exportId/download', async (req: Request, res: Response, next) => {
  try {
    const { exportId } = req.params;
    console.log(`📥 Download request for export ${exportId}`);

    // Find file
    const files = await fs.readdir(config.exportDir);
    const fileName = files.find(f => f.startsWith(`export-${exportId}`));

    if (!fileName) {
      console.log(`⚠️  Export file not found: ${exportId}`);
      throw new AppError(404, 'Export not found');
    }

    const filePath = path.join(config.exportDir, fileName);
    console.log(`✅ Sending file: ${fileName}`);
    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    next(error);
  }
});

export const exportRoutes = router;
