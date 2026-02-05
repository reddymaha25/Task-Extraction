/**
 * Automatic LLM Provider Selection
 * 
 * Automatically selects the best available LLM provider based on:
 * - Configuration availability
 * - Provider health/reachability
 * - Preferred order: Azure OpenAI → OpenAI → Open Source (Ollama)
 */

import { LLMMode } from '@task-platform/shared';
import { OpenSourceConfig, OpenAIConfig, AzureOpenAIConfig } from './types';

interface LLMConfigs {
  openSource?: OpenSourceConfig;
  openai?: OpenAIConfig;
  azureOpenai?: AzureOpenAIConfig;
  defaultProvider?: LLMMode;
}

/**
 * Checks if Azure OpenAI is configured and available
 */
function isAzureOpenAIAvailable(config?: AzureOpenAIConfig): boolean {
  return !!(
    config &&
    config.apiKey &&
    config.apiKey.length > 0 &&
    config.endpoint &&
    config.endpoint.length > 0 &&
    config.deploymentName &&
    config.deploymentName.length > 0
  );
}

/**
 * Checks if OpenAI is configured and available
 */
function isOpenAIAvailable(config?: OpenAIConfig): boolean {
  return !!(
    config &&
    config.apiKey &&
    config.apiKey.length > 0
  );
}

/**
 * Checks if Open Source (Ollama) is configured
 */
function isOpenSourceAvailable(config?: OpenSourceConfig): boolean {
  return !!(
    config &&
    config.baseUrl &&
    config.baseUrl.length > 0 &&
    config.model &&
    config.model.length > 0
  );
}

/**
 * Automatically selects the best available LLM provider
 * 
 * Selection order:
 * 1. Use defaultProvider if specified and available
 * 2. Azure OpenAI (most reliable, enterprise-grade)
 * 3. OpenAI (reliable, cloud-based)
 * 4. Open Source/Ollama (local, always available as fallback)
 * 
 * @param configs - Configuration objects for all providers
 * @returns Selected LLM mode
 */
export function autoSelectLLM(configs: LLMConfigs): LLMMode {
  // Priority 0: Use default provider if specified and configured
  if (configs.defaultProvider) {
    const isAvailable = (
      (configs.defaultProvider === LLMMode.AZURE_OPENAI && isAzureOpenAIAvailable(configs.azureOpenai)) ||
      (configs.defaultProvider === LLMMode.OPENAI && isOpenAIAvailable(configs.openai)) ||
      (configs.defaultProvider === LLMMode.OPEN_SOURCE && isOpenSourceAvailable(configs.openSource))
    );
    
    if (isAvailable) {
      console.log(`🤖 Using configured default LLM: ${getLLMDisplayName(configs.defaultProvider)}`);
      return configs.defaultProvider;
    } else {
      console.warn(`⚠️ Default LLM provider ${configs.defaultProvider} not available, falling back to auto-selection`);
    }
  }
  
  // Priority 1: Azure OpenAI
  if (isAzureOpenAIAvailable(configs.azureOpenai)) {
    console.log('🤖 Auto-selected LLM: Azure OpenAI (configured and available)');
    return LLMMode.AZURE_OPENAI;
  }

  // Priority 2: OpenAI
  if (isOpenAIAvailable(configs.openai)) {
    console.log('🤖 Auto-selected LLM: OpenAI (configured and available)');
    return LLMMode.OPENAI;
  }

  // Priority 3: Open Source (Ollama) - fallback
  if (isOpenSourceAvailable(configs.openSource)) {
    console.log('🤖 Auto-selected LLM: Open Source/Ollama (fallback)');
    return LLMMode.OPEN_SOURCE;
  }

  // No providers configured - default to Open Source
  console.warn('⚠️ No LLM providers configured, defaulting to Open Source');
  return LLMMode.OPEN_SOURCE;
}

/**
 * Gets a human-readable name for the LLM mode
 */
function getLLMDisplayName(mode: LLMMode): string {
  switch (mode) {
    case LLMMode.AZURE_OPENAI:
      return 'Azure OpenAI';
    case LLMMode.OPENAI:
      return 'OpenAI';
    case LLMMode.OPEN_SOURCE:
      return 'Open Source (Ollama)';
    default:
      return 'Unknown';
  }
}
