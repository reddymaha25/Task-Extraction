import { Router, Request, Response } from 'express';
import { createTaskRepository } from '@task-platform/db';
import { UpdateTaskRequestSchema, validateSchema } from '@task-platform/shared';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * GET /api/v1/runs/:runId/tasks - Get tasks for a run
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const runId = req.query.runId as string;
    if (!runId) {
      throw new AppError(400, 'runId query parameter required');
    }

    const taskRepo = createTaskRepository();
    const tasks = await taskRepo.findByRunId(runId);

    res.json({
      tasks: tasks.map(task => ({
        id: task.id,
        runId: task.runId,
        title: task.title,
        description: task.description,
        ownerRaw: task.ownerRaw,
        ownerNormalized: task.ownerNormalized,
        dueDateRaw: task.dueDateRaw,
        dueDateISO: task.dueDateISO,
        priority: task.priority,
        status: task.status,
        confidence: task.confidence,
        sourceQuote: task.sourceQuote,
        sourceLocation: task.sourceLocation,
        tags: task.tags,
        integrationState: task.integrationState,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
      total: tasks.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/tasks/:taskId - Update a task
 */
router.patch('/:taskId', async (req: Request, res: Response, next) => {
  try {
    const { taskId } = req.params;

    const validation = validateSchema(UpdateTaskRequestSchema, req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const data = validation.data;
    const taskRepo = createTaskRepository();

    const updated = await taskRepo.update(taskId, {
      ...data,
      dueDateISO: data.dueDateISO ? new Date(data.dueDateISO) : undefined,
    });

    res.json({
      id: updated.id,
      title: updated.title,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export const taskRoutes = router;
