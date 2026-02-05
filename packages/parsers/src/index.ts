/**
 * File parsers package exports
 */

export * from './types';
export { PDFParser, createPDFParser } from './pdf.parser';
export { DOCXParser, createDOCXParser } from './docx.parser';
export { EMLParser, createEMLParser } from './eml.parser';
export { EmailThreadParser, createEmailThreadParser } from './email-thread.parser';

import { Parser } from './types';
import { createPDFParser } from './pdf.parser';
import { createDOCXParser } from './docx.parser';
import { createEMLParser } from './eml.parser';
import { InputType } from '@task-platform/shared';

/**
 * Get appropriate parser for input type
 */
export function getParser(inputType: InputType): Parser {
  switch (inputType) {
    case InputType.PDF:
      return createPDFParser();
    case InputType.DOCX:
      return createDOCXParser();
    case InputType.EML:
      return createEMLParser();
    default:
      throw new Error(`No parser available for input type: ${inputType}`);
  }
}

/**
 * Get parser by MIME type
 */
export function getParserByMimeType(mimeType: string): Parser | null {
  const parsers = [
    createPDFParser(),
    createDOCXParser(),
    createEMLParser(),
  ];

  return parsers.find(p => p.supports(mimeType)) || null;
}
