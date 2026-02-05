/**
 * Shared constants used across the platform
 */

/**
 * Confidence thresholds for task quality scoring
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3
} as const;

/**
 * Maximum file sizes
 */
export const FILE_SIZE_LIMITS = {
  PDF_MB: 50,
  DOCX_MB: 25,
  EML_MB: 10,
  ATTACHMENT_MB: 10
} as const;

/**
 * Supported MIME types
 */
export const SUPPORTED_MIME_TYPES = {
  PDF: ['application/pdf'],
  DOCX: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ],
  EML: ['message/rfc822', 'application/vnd.ms-outlook']
} as const;

/**
 * Vague action verbs that lower confidence
 */
export const VAGUE_VERBS = [
  'look into',
  'consider',
  'think about',
  'explore',
  'investigate',
  'maybe',
  'perhaps',
  'possibly'
] as const;

/**
 * Common email signature indicators
 */
export const EMAIL_SIGNATURE_MARKERS = [
  'Sent from my',
  'Get Outlook for',
  'Best regards',
  'Kind regards',
  'Sincerely',
  'Thanks',
  'Cheers',
  '--',
  '___'
] as const;

/**
 * Email thread indicators (for reply trimming)
 */
export const EMAIL_THREAD_MARKERS = [
  'On .*wrote:',
  'From:.*Sent:',
  '-----Original Message-----',
  '________________________________'
] as const;

/**
 * Default LLM parameters
 */
export const LLM_DEFAULTS = {
  TEMPERATURE: 0.1,
  MAX_TOKENS: 4096,
  TOP_P: 0.95,
  FREQUENCY_PENALTY: 0,
  PRESENCE_PENALTY: 0
} as const;

/**
 * Extraction pipeline timeouts (ms)
 */
export const TIMEOUTS = {
  PARSE_FILE: 30000,
  LLM_CALL: 60000,
  INTEGRATION_PUSH: 30000,
  EXPORT_GENERATION: 30000
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

/**
 * Date parsing patterns
 */
export const RELATIVE_DATE_PATTERNS = [
  'today',
  'tomorrow',
  'next week',
  'next monday',
  'next tuesday',
  'next wednesday',
  'next thursday',
  'next friday',
  'end of week',
  'end of month'
] as const;

/**
 * Task deduplication similarity threshold
 */
export const DEDUP_SIMILARITY_THRESHOLD = 0.85;

/**
 * Chunking parameters for long documents
 */
export const CHUNKING = {
  MAX_CHUNK_SIZE: 4000, // characters
  OVERLAP: 200 // characters
} as const;

/**
 * Rate limiting
 */
export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
} as const;

/**
 * Export file retention (days)
 */
export const EXPORT_RETENTION_DAYS = 7;

/**
 * Webhook signature algorithms
 */
export const WEBHOOK_SIGNATURE_ALGORITHM = 'sha256';
