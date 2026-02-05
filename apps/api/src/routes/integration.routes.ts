import { Router, Request, Response } from 'express';
import { createTaskRepository } from '@task-platform/db';
import { createIntegrationAdapter } from '@task-platform/integrations';
import { PushTasksRequestSchema, validateSchema, IntegrationName } from '@task-platform/shared';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * POST /api/v1/integrations/:runId/push - Push tasks to integration
 */
router.post('/:runId/push', async (req: Request, res: Response, next) => {
  try {
    const { runId } = req.params;
    const { targetId, taskIds, mappingOptions } = req.body;

    console.log('📥 RECEIVED PUSH REQUEST:', {
      runId,
      targetId,
      taskIds,
      taskIdsLength: taskIds?.length || 0,
      requestBody: req.body
    });

    if (!targetId || !taskIds || !Array.isArray(taskIds)) {
      throw new AppError(400, 'targetId and taskIds are required');
    }

    const taskRepo = createTaskRepository();

    // Get tasks
    const allTasks = await taskRepo.findByRunId(runId);
    const tasksToSync = allTasks.filter(t => taskIds.includes(t.id));

    if (tasksToSync.length === 0) {
      throw new AppError(400, 'No tasks found to sync');
    }

    // Create integration adapter based on targetId
    const integrationName = targetId as IntegrationName;
    const adapter = createIntegrationAdapter(integrationName);

    // Build config based on integration type
    let config: any = {};
    
    switch (integrationName) {
      case IntegrationName.JIRA:
        config = {
          baseUrl: process.env.JIRA_BASE_URL || '',
          email: process.env.JIRA_EMAIL || '',
          apiToken: process.env.JIRA_API_TOKEN || '',
          projectKey: process.env.JIRA_PROJECT_KEY || '',
        };
        break;
      
      case IntegrationName.ASANA:
        config = {
          accessToken: process.env.ASANA_ACCESS_TOKEN || '',
          workspaceId: process.env.ASANA_WORKSPACE_ID || '',
        };
        break;
      
      case IntegrationName.MICROSOFT_TODO:
        config = {
          accessToken: process.env.MICROSOFT_TODO_ACCESS_TOKEN || '',
        };
        break;
      
      case IntegrationName.WEBHOOK:
        config = {
          webhookUrl: process.env.WEBHOOK_URL || '',
          webhookSecret: process.env.WEBHOOK_SECRET || '',
        };
        break;
      
      default:
        throw new AppError(400, `Unsupported integration: ${integrationName}`);
    }

    console.log(`🚀 Pushing ${tasksToSync.length} tasks to ${integrationName}...`);

    // Push tasks
    const results = await adapter.createTasks(tasksToSync, config, mappingOptions);

    console.log(`✅ Push complete: ${results.filter(r => r.status === 'SUCCESS').length} succeeded, ${results.filter(r => r.status === 'FAILED').length} failed`);

    // Update task integration state
    for (const result of results) {
      if (result.status === 'SUCCESS' && result.externalId) {
        await taskRepo.updateIntegrationState(result.taskId, integrationName, {
          externalId: result.externalId,
          syncStatus: result.status,
          lastSyncedAt: new Date(),
        });
      }
    }

    res.json({
      targetId,
      results,
      successCount: results.filter(r => r.status === 'SUCCESS').length,
      failureCount: results.filter(r => r.status === 'FAILED').length,
    });
  } catch (error) {
    console.error('❌ Push error:', error);
    next(error);
  }
});

export const integrationRoutes = router;
