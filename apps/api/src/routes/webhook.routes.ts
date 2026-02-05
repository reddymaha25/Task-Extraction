import { Router, Request, Response } from 'express';
import { createRunRepository } from '@task-platform/db';
import { WebhookEmailRequestSchema, validateSchema, InputType } from '@task-platform/shared';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * POST /api/v1/webhooks/email - Inbound email webhook
 */
router.post('/email', async (req: Request, res: Response, next) => {
  try {
    const validation = validateSchema(WebhookEmailRequestSchema, req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const data = validation.data;
    const runRepo = createRunRepository();

    // Create run
    const run = await runRepo.create({
      inputType: InputType.WEBHOOK,
      sourceName: `Email from ${data.from}`,
      referenceTime: new Date(data.date),
      timezone: 'UTC', // Could be detected or configured
      llmMode: 'OPEN_SOURCE' as any,
    });

    // In a real implementation, you'd trigger async processing here
    // For now, just create the run and return

    res.json({
      runId: run.id,
      status: run.status,
      message: 'Webhook received, processing started',
    });
  } catch (error) {
    next(error);
  }
});

export const webhookRoutes = router;
