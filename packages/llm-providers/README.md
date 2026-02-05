# @task-platform/llm-providers

## Purpose
LLM provider abstraction layer supporting multiple backends (open-source local models and OpenAI).

## Responsibilities
- Unified interface for LLM operations
- Provider implementations (OpenSource, OpenAI)
- JSON extraction and validation
- Prompt engineering for task extraction
- Error handling and retries

## Provider Interface

All providers must implement:

```typescript
interface LLMProvider {
  // Extract candidate tasks from text (Pass A)
  extractCandidates(
    input: string,
    context: ExtractionContext
  ): Promise<CandidateTask[]>;

  // Validate and normalize candidates (Pass B)
  validateAndNormalize(
    candidates: CandidateTask[],
    context: ExtractionContext
  ): Promise<Task[]>;

  // Generate stakeholder summary
  generateStakeholderSummary(
    input: string,
    tasks: Task[],
    context: ExtractionContext
  ): Promise<StakeholderSummary>;
}
```

## Providers

### OpenSourceProvider (Default)
- Connects to local LLM server (e.g., Ollama)
- Uses HTTP API
- Configurable model and parameters
- JSON mode support

### OpenAIProvider (Optional)
- Uses OpenAI API
- GPT-4 Turbo recommended
- JSON mode enabled
- Requires API key

## Configuration

```typescript
// Open-source (default)
const provider = createOpenSourceProvider({
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  temperature: 0.1,
  maxTokens: 4096
});

// OpenAI (optional)
const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4-turbo-preview',
  temperature: 0.1
});
```

## Extraction Strategy

### Two-Pass Extraction
1. **Pass A: Candidate Extraction**
   - Identify potential tasks with quotes
   - Lenient parsing
   - Extract all possibilities

2. **Pass B: Validation & Normalization**
   - Strict schema validation
   - Drop tasks without quotes
   - Resolve dates/owners
   - Calculate confidence

### Prompting Best Practices
- Be explicit about required fields (sourceQuote)
- Request JSON output
- Provide examples in prompts
- Use system messages for behavior
- Keep prompts deterministic

## Error Handling
- Automatic retry with exponential backoff
- Fallback to simpler prompts on failure
- Timeout protection
- JSON parsing recovery
