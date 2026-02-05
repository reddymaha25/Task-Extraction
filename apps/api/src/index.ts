import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { runRoutes } from './routes/run.routes';
import { taskRoutes } from './routes/task.routes';
import { uploadRoutes } from './routes/upload.routes';
import { exportRoutes } from './routes/export.routes';
import { integrationRoutes } from './routes/integration.routes';
import { webhookRoutes } from './routes/webhook.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/runs', runRoutes);
app.use('/api/v1/runs', exportRoutes); // Export creation under /runs/:runId/exports
app.use('/api/v1/exports', exportRoutes); // Export download under /exports/:exportId/download
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/integrations', integrationRoutes);
if (config.webhookEnabled) {
  app.use('/api/v1/webhooks', webhookRoutes);
}

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 API server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🤖 Default LLM: ${config.defaultLLMProvider}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
