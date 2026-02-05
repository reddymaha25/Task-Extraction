/**
 * Utility functions shared across packages
 */

import { RELATIVE_DATE_PATTERNS } from './constants';

/**
 * Format a date to ISO 8601 string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO 8601 string to Date
 */
export function fromISOString(iso: string): Date {
  return new Date(iso);
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/ +/g, ' ') // Collapse multiple spaces
    .replace(/\n\n+/g, '\n\n') // Collapse multiple newlines
    .trim();
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a string matches a relative date pattern
 */
export function isRelativeDate(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return RELATIVE_DATE_PATTERNS.some(pattern => 
    normalized.includes(pattern.toLowerCase())
  );
}

/**
 * Extract email address from a string like "John Doe <john@example.com>"
 */
export function extractEmail(text: string): string | null {
  const match = text.match(/<(.+?)>/);
  if (match) {
    return match[1];
  }
  
  // Check if the entire string is an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(text)) {
    return text;
  }
  
  return null;
}

/**
 * Extract name from a string like "John Doe <john@example.com>"
 */
export function extractName(text: string): string | null {
  const match = text.match(/^(.+?)\s*</);
  if (match) {
    return match[1].trim();
  }
  
  // If no email, return the text itself
  return text.trim() || null;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 255);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        const delay = Math.min(
          initialDelayMs * Math.pow(backoffFactor, attempt - 1),
          maxDelayMs
        );
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}
