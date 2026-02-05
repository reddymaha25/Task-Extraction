import { ExtractionContext } from '@task-platform/shared';

/**
 * System prompt for task extraction
 */
export const SYSTEM_PROMPT = `You are an expert task extraction assistant. Your job is to analyze text and extract actionable tasks with perfect traceability.

CRITICAL RULES:
1. ALWAYS respond with valid JSON - either an array [] or object {}
2. Every task MUST include a sourceQuote - the exact text from the input that describes the task
3. NEVER make up or infer information not explicitly stated
4. If owner or due date is not mentioned, use null (not undefined)
5. Be conservative - better to miss a vague task than create a false positive

TASK STRUCTURE:
{
  "title": "Clear, actionable summary",
  "description": "Optional details or null",
  "owner": "Person's name as written or null",
  "dueDate": "Due date as written or null",
  "priority": "P0/P1/P2/P3 if mentioned or null",
  "status": "NEW",
  "sourceQuote": "REQUIRED: Exact text from input",
  "confidence": 0.0 to 1.0
}

RESPOND WITH JSON ARRAY OF TASKS: [task1, task2, ...]
If no tasks found, respond with: []`;

/**
 * Generate candidate extraction prompt
 */
export function generateCandidatePrompt(input: string, context: ExtractionContext): string {
  return `Extract ALL potential tasks from the following text. Be lenient - include anything that might be a task.

CONTEXT:
- Reference time: ${context.referenceTime.toISOString()}
- Timezone: ${context.timezone}
- Source type: ${context.inputType}
${context.sourceName ? `- Source: ${context.sourceName}` : ''}

TEXT TO ANALYZE:
"""
${input}
"""

IMPORTANT OUTPUT FORMAT:
You MUST respond with ONLY a JSON object in this exact format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Details or null",
      "owner": "Name or null",
      "dueDate": "Date string or null",
      "priority": null,
      "status": "NEW",
      "sourceQuote": "Exact quote from text above",
      "confidence": 0.9
    }
  ]
}

If no tasks found, respond with: {"tasks": []}
Do NOT include any text before or after the JSON.

Extract tasks now:`;
}

/**
 * Generate validation and normalization prompt
 */
export function generateValidationPrompt(
  candidates: any[],
  context: ExtractionContext
): string {
  return `Review and validate these candidate tasks. Apply strict rules:

VALIDATION RULES:
1. REJECT any task without a sourceQuote
2. REJECT vague tasks ("look into", "consider", "maybe")
3. Keep owner null if not explicitly mentioned
4. Keep dueDate null if not explicitly mentioned
5. Calculate confidence based on:
   - Has clear owner: +0.3
   - Has clear due date: +0.3
   - Has specific action verb: +0.2
   - Source quote is detailed: +0.2

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

CONTEXT:
- Reference time: ${context.referenceTime.toISOString()}
- Timezone: ${context.timezone}

IMPORTANT: Wrap your response in a JSON object with a "tasks" property containing an array.
Example: {"tasks": [task1, task2, task3]}

If no tasks are valid, respond with: {"tasks": []}`;
}

/**
 * Generate stakeholder summary prompt
 */
export function generateSummaryPrompt(
  input: string,
  tasks: any[],
  context: ExtractionContext
): string {
  return `Analyze the following content and extract a stakeholder summary.

EXTRACT:
1. Decisions: Key decisions that were made
2. Risks: Identified risks, blockers, or concerns
3. Asks: Questions or requests for input/clarification
4. Key Points: Other important information

TEXT:
"""
${input}
"""

${tasks.length > 0 ? `\nEXTRACTED TASKS (for context):\n${tasks.map(t => `- ${t.title}`).join('\n')}` : ''}

RESPOND WITH JSON:
{
  "decisions": ["decision 1", "decision 2"],
  "risks": ["risk 1", "risk 2"],
  "asks": ["ask 1", "ask 2"],
  "keyPoints": ["point 1", "point 2"]
}

If no items for a category, use empty array. Be concise.`;
}

/**
 * Example few-shot for better extraction
 */
export const FEW_SHOT_EXAMPLES = `
EXAMPLE 1:
Input: "Rayan, please finalize the dashboard by next Friday."
Output:
[{
  "title": "Finalize dashboard",
  "description": null,
  "owner": "Rayan",
  "dueDate": "next Friday",
  "priority": null,
  "status": "NEW",
  "sourceQuote": "Rayan, please finalize the dashboard by next Friday.",
  "confidence": 0.9
}]

EXAMPLE 2:
Input: "We should consider migrating to the cloud sometime."
Output:
[{
  "title": "Consider cloud migration",
  "description": null,
  "owner": null,
  "dueDate": null,
  "priority": null,
  "status": "NEW",
  "sourceQuote": "We should consider migrating to the cloud sometime.",
  "confidence": 0.3
}]

EXAMPLE 3:
Input: "Alex to confirm data source access by Feb 10. This is critical for the launch."
Output:
[{
  "title": "Confirm data source access",
  "description": "Critical for the launch",
  "owner": "Alex",
  "dueDate": "Feb 10",
  "priority": "P0",
  "status": "NEW",
  "sourceQuote": "Alex to confirm data source access by Feb 10. This is critical for the launch.",
  "confidence": 0.95
}]`;

/**
 * Generate meeting minutes extraction prompt
 */
export function generateMeetingMinutesPrompt(text: string): string {
  return `Extract meeting information from the following text. Identify:

1. Meeting title/subject (if mentioned)
2. Meeting date/time (if mentioned)
3. Participants/attendees
4. Agenda items or topics discussed
5. Key discussion notes
6. Next steps or follow-up actions

TEXT:
${text}

Respond with a JSON object in this exact format:
{
  "title": "Meeting title or subject",
  "date": "ISO date string or null",
  "participants": ["Name1", "Name2"],
  "agenda": ["Topic 1", "Topic 2"],
  "notes": "General meeting notes and discussion summary",
  "nextSteps": ["Next step 1", "Next step 2"]
}

If information is not available, use null for strings or empty arrays for lists.
Do NOT include any text before or after the JSON.

Extract meeting minutes now:`;
}
