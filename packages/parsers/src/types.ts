import { ParsedDocument } from '@task-platform/shared';

/**
 * Parser interface
 * All file parsers must implement this interface
 */
export interface Parser {
  /**
   * Parse a file buffer into a ParsedDocument
   * @param buffer - The file content as a Buffer
   * @returns Parsed document with text and metadata
   */
  parse(buffer: Buffer): Promise<ParsedDocument>;

  /**
   * Check if this parser supports a given MIME type
   * @param mimeType - The MIME type to check
   * @returns True if this parser can handle the MIME type
   */
  supports(mimeType: string): boolean;
}

/**
 * Parser options
 */
export interface ParserOptions {
  timeout?: number; // Parsing timeout in milliseconds
  maxPages?: number; // Maximum pages to extract (for PDFs)
  includeImages?: boolean; // Whether to process images
  parseThreads?: boolean; // Whether to parse nested RFC822 email threads (EML only)
}
