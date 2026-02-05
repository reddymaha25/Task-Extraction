# Automatic LLM Provider Selection

## Overview

The platform now **automatically selects** the best available LLM provider based on configuration and availability. Users no longer need to manually choose between Azure OpenAI, OpenAI, or Ollama.

## Selection Priority

The system selects providers in the following order:

1. **Azure OpenAI** (Highest Priority)
   - Enterprise-grade, most reliable
   - Selected if API key, endpoint, and deployment name are configured

2. **OpenAI** (Medium Priority)
   - Cloud-based, reliable
   - Selected if API key is configured and Azure OpenAI is not available

3. **Open Source (Ollama)** (Fallback)
   - Local LLM, always available as fallback
   - Selected if no cloud providers are configured

## Configuration

LLM providers are configured via environment variables in `.env`:

### Azure OpenAI
```env
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### OpenAI
```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4-turbo-preview
```

### Ollama (Open Source)
```env
OPEN_LLM_BASE_URL=http://localhost:11434
OPEN_LLM_MODEL=llama2
```

## How It Works

1. **User creates a new run** - No LLM selection required in UI
2. **Backend checks availability** - Validates which providers are configured
3. **Auto-selection** - Picks the best available provider based on priority
4. **Processing** - Uses the selected provider for extraction
5. **Result** - Run details show which provider was used

## Benefits

✅ **Simplified UX** - No manual provider selection needed  
✅ **Intelligent fallback** - Automatically uses Ollama if cloud providers unavailable  
✅ **Configuration-driven** - Just set environment variables  
✅ **Reliability** - Prefers more reliable providers first  
✅ **Transparency** - Logs show which provider was selected  

## Logging

Check backend logs to see which provider was selected:

```
🤖 Auto-selected LLM: Azure OpenAI (configured and available)
```

Or:

```
🤖 Auto-selected LLM: Open Source/Ollama (fallback)
```

## Migration Notes

**Previous behavior:**
- Users manually selected LLM provider in UI dropdown
- `llmMode` parameter sent with each request

**Current behavior:**
- No UI selector - automatic selection
- `llmMode` removed from API request schema
- Backend auto-selects based on configuration

**No action required** - Existing runs will continue to work. New runs automatically use the best available provider.
