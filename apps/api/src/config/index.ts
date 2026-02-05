import dotenv from 'dotenv';
import path from 'path';
import { LLMMode } from '@task-platform/shared';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/task_extraction',

  // LLM Configuration
  defaultLLMProvider: (process.env.DEFAULT_LLM_PROVIDER || 'OPEN_SOURCE') as LLMMode,

  // Open-source LLM
  openLLM: {
    baseUrl: process.env.OPEN_LLM_BASE_URL || 'http://localhost:11434',
    model: process.env.OPEN_LLM_MODEL || 'llama2',
    temperature: parseFloat(process.env.OPEN_LLM_TEMPERATURE || '0.1'),
    maxTokens: parseInt(process.env.OPEN_LLM_MAX_TOKENS || '4096', 10),
    timeout: parseInt(process.env.OPEN_LLM_TIMEOUT || '300000', 10),
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
  },

  // Azure OpenAI
  azureOpenai: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '0.1'),
    maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '4096', 10),
  },

  // File Upload
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  exportDir: process.env.EXPORT_DIR || './exports',
  
  // Email parsing
  parseEmailThreads: process.env.PARSE_EMAIL_THREADS === 'true',

  // Security
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',

  // Webhook
  webhookSecret: process.env.WEBHOOK_SECRET || 'change-this-webhook-secret',
  webhookEnabled: process.env.WEBHOOK_ENABLED === 'true',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};
