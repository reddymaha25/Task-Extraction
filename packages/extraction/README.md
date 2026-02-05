# @task-platform/extraction

## Purpose
Orchestration pipeline for extracting, validating, and normalizing tasks from unstructured content.

## Responsibilities
- Pipeline orchestration (parse → clean → extract → validate → dedupe)
- Text cleaning and preprocessing
- Relative date resolution
- Task deduplication
- Confidence scoring
- Integration with LLM providers and parsers

## Pipeline Steps

### 1. Parsing
- Convert files to text using appropriate parser
- Extract sections and metadata

### 2. Cleaning
- Remove email signatures and quoted replies
- Normalize whitespace
- De-hyphenate line breaks

### 3. Chunking (for long documents)
- Split into manageable chunks
- Maintain overlap for context
- Track offsets for traceability

### 4. LLM Extraction (Two-Pass)
- **Pass A**: Extract candidate tasks with lenient criteria
- **Pass B**: Validate and normalize with strict rules

### 5. Post-Processing
- Resolve relative dates using reference time/timezone
- Calculate confidence scores
- Deduplicate similar tasks
- Normalize owner names

### 6. Persistence
- Store tasks and summary in database
- Update run statistics

## Usage

```typescript
import { ExtractionService } from '@task-platform/extraction';
import { createLLMProvider } from '@task-platform/llm-providers';

const service = new ExtractionService({
  llmProvider: createLLMProvider(LLMMode.OPEN_SOURCE, config),
});

const result = await service.processRun({
  runId: 'run-123',
  inputType: InputType.TEXT,
  text: 'Meeting notes...',
  referenceTime: new Date(),
  timezone: 'America/New_York',
});

console.log(result.tasks.length);
console.log(result.summary);
```

## Reliability Rules (Enforced)

1. **No-quote, no-task**: Tasks without sourceQuote are dropped
2. **No guessing**: Missing owners/dates stay null
3. **Thread trimming**: Email quoted replies removed
4. **Deduplication**: Similar tasks merged
5. **Confidence scoring**: Vague tasks flagged low confidence

## Date Resolution

Uses chrono-node for intelligent date parsing:
- "next Friday" → actual date
- "Feb 10" → current year assumed
- "EOD" → end of reference day
- Respects timezone

## Confidence Calculation

Base: 0.5
- Has owner: +0.3
- Has due date: +0.3
- Specific verb (not vague): +0.2
- Detailed quote: +0.2
- Vague verb: -0.4
- Missing critical fields: -0.3
