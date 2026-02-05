import pdfParse from 'pdf-parse';
import { Parser, ParserOptions } from './types';
import { ParsedDocument, DocumentSection, SUPPORTED_MIME_TYPES } from '@task-platform/shared';

/**
 * PDF Parser
 * Extracts text from PDF documents with page tracking
 */
export class PDFParser implements Parser {
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 30000,
      maxPages: options.maxPages ?? 1000,
      includeImages: options.includeImages ?? false,
      parseThreads: options.parseThreads ?? false,
    };
  }

  /**
   * Parse PDF buffer
   */
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const data = await pdfParse(buffer, {
        max: this.options.maxPages,
      });

      // Extract text by page if available
      const sections: DocumentSection[] = [];
      
      // pdf-parse doesn't provide per-page text easily, so we split by form feeds
      // or use the full text as one section
      const pageTexts = data.text.split('\f'); // Form feed character often separates pages
      
      pageTexts.forEach((pageText, index) => {
        if (pageText.trim()) {
          sections.push({
            title: `Page ${index + 1}`,
            content: pageText.trim(),
            startOffset: 0, // Would need to track this properly
            endOffset: pageText.length,
            page: index + 1,
          });
        }
      });

      return {
        text: data.text,
        sections: sections.length > 0 ? sections : undefined,
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          createdDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          author: data.info?.Author,
          subject: data.info?.Subject,
        },
      };
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Check if this parser supports the MIME type
   */
  supports(mimeType: string): boolean {
    return (SUPPORTED_MIME_TYPES.PDF as readonly string[]).includes(mimeType);
  }
}

/**
 * Factory function to create PDF parser
 */
export function createPDFParser(options?: ParserOptions): Parser {
  return new PDFParser(options);
}
