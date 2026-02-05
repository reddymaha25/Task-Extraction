import * as chrono from 'chrono-node';
import { normalizeWhitespace, VAGUE_VERBS } from '@task-platform/shared';

/**
 * Text cleaning utilities for extraction pipeline
 */

/**
 * Clean text for extraction
 * - Normalize whitespace
 * - Remove excessive punctuation
 * - De-hyphenate line breaks
 */
export function cleanText(text: string): string {
  let cleaned = text;

  // De-hyphenate line breaks (common in PDFs)
  cleaned = cleaned.replace(/-\n/g, '');

  // Normalize whitespace
  cleaned = normalizeWhitespace(cleaned);

  // Remove excessive punctuation
  cleaned = cleaned.replace(/\.{4,}/g, '...');
  cleaned = cleaned.replace(/!{2,}/g, '!');
  cleaned = cleaned.replace(/\?{2,}/g, '?');

  return cleaned;
}

/**
 * Chunk long text into manageable pieces
 */
export function chunkText(
  text: string,
  options: {
    maxChunkSize?: number;
    overlap?: number;
  } = {}
): Array<{ text: string; startOffset: number; endOffset: number }> {
  const maxChunkSize = options.maxChunkSize || 4000;
  const overlap = options.overlap || 200;

  if (text.length <= maxChunkSize) {
    return [{ text, startOffset: 0, endOffset: text.length }];
  }

  const chunks: Array<{ text: string; startOffset: number; endOffset: number }> = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length);

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + maxChunkSize * 0.7) {
        end = breakPoint + 1;
      }
    }

    chunks.push({
      text: text.substring(start, end).trim(),
      startOffset: start,
      endOffset: end,
    });

    start = end - overlap;
  }

  return chunks;
}

/**
 * Resolve relative date to ISO string
 */
export function resolveDate(
  dateString: string,
  referenceTime: Date,
  timezone: string
): string | null {
  try {
    // Use chrono-node for intelligent date parsing
    const parsed = chrono.parseDate(dateString, referenceTime, { forwardDate: true });
    
    if (parsed) {
      return parsed.toISOString();
    }

    return null;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error);
    return null;
  }
}

/**
 * Check if text contains vague action verbs
 */
export function containsVagueVerb(text: string): boolean {
  const lowerText = text.toLowerCase();
  return VAGUE_VERBS.some(verb => lowerText.includes(verb.toLowerCase()));
}

/**
 * Calculate confidence score for a task
 */
export function calculateConfidence(task: {
  title: string;
  ownerRaw?: string;
  dueDateRaw?: string;
  sourceQuote: string;
}): number {
  let confidence = 0.5; // Base confidence

  // Has owner
  if (task.ownerRaw) {
    confidence += 0.3;
  }

  // Has due date
  if (task.dueDateRaw) {
    confidence += 0.3;
  }

  // Vague verb penalty
  if (containsVagueVerb(task.title)) {
    confidence -= 0.4;
  } else {
    // Specific action verb bonus
    confidence += 0.2;
  }

  // Detailed quote bonus
  if (task.sourceQuote.length > 50) {
    confidence += 0.2;
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Extract potential owner names from text
 * Looks for patterns like "John to do X" or "assign to Sarah"
 */
export function extractOwnerFromText(text: string): string | null {
  // Pattern: "Name, please..." or "Name to do..."
  const patterns = [
    /^([A-Z][a-z]+),?\s+(please|to|should|will)/,
    /assign(?:ed)?\s+to\s+([A-Z][a-z]+)/i,
    /([A-Z][a-z]+)\s+(?:to|will|should)\s+(?:do|complete|finish|handle)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
