/**
 * LLM Providers package exports
 */

export * from './types';
export * from './prompts';
export * from './auto-selector';
export { OpenSourceProvider, createOpenSourceProvider } from './providers/opensource.provider';
export { OpenAIProvider, createOpenAIProvider } from './providers/openai.provider';
export { AzureOpenAIProvider, createAzureOpenAIProvider } from './providers/azure-openai.provider';

import { LLMProvider, OpenSourceConfig, OpenAIConfig, AzureOpenAIConfig } from './types';
import { createOpenSourceProvider } from './providers/opensource.provider';
import { createOpenAIProvider } from './providers/openai.provider';
import { createAzureOpenAIProvider } from './providers/azure-openai.provider';
import { LLMMode } from '@task-platform/shared';

/**
 * Factory to create appropriate LLM provider based on mode
 */
export function createLLMProvider(
  mode: LLMMode,
  config: {
    openSource?: OpenSourceConfig;
    openai?: OpenAIConfig;
    azureOpenai?: AzureOpenAIConfig;
  }
): LLMProvider {
  switch (mode) {
    case LLMMode.OPEN_SOURCE:
      if (!config.openSource) {
        throw new Error('OpenSource config required for OPEN_SOURCE mode');
      }
      return createOpenSourceProvider(config.openSource);

    case LLMMode.AZURE_OPENAI:
      if (!config.azureOpenai || !config.azureOpenai.apiKey) {
        throw new Error('Azure OpenAI config required for AZURE_OPENAI mode');
      }
      return createAzureOpenAIProvider(config.azureOpenai);

    case LLMMode.OPENAI:
      // Use Azure OpenAI if configured, otherwise standard OpenAI
      if (config.azureOpenai && config.azureOpenai.apiKey) {
        return createAzureOpenAIProvider(config.azureOpenai);
      }
      if (!config.openai) {
        throw new Error('OpenAI config required for OPENAI mode');
      }
      return createOpenAIProvider(config.openai);

    default:
      throw new Error(`Unknown LLM mode: ${mode}`);
  }
}
