import mammoth from 'mammoth';
import { Parser, ParserOptions } from './types';
import { ParsedDocument, DocumentSection, SUPPORTED_MIME_TYPES } from '@task-platform/shared';

/**
 * DOCX Parser
 * Extracts text from Word documents preserving structure
 */
export class DOCXParser implements Parser {
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
   * Parse DOCX buffer
   */
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    try {
      // Extract plain text
      const textResult = await mammoth.extractRawText({ buffer });
      const text = textResult.value;

      // Extract with HTML to get structure (headings, etc.)
      const htmlResult = await mammoth.convertToHtml({ buffer });
      const sections = this.extractSections(htmlResult.value, text);

      return {
        text,
        sections: sections.length > 0 ? sections : undefined,
        metadata: {
          wordCount: text.split(/\s+/).length,
        },
      };
    } catch (error: any) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract sections from HTML (headings become sections)
   */
  private extractSections(html: string, fullText: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    
    // Simple regex to find headings
    const headingRegex = /<h([1-6])>(.*?)<\/h\1>/gi;
    let match;
    let lastIndex = 0;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags

      // Find this heading in the plain text
      const titleIndex = fullText.indexOf(title, lastIndex);
      if (titleIndex >= 0) {
        sections.push({
          title,
          content: '', // Would need to extract content between headings
          startOffset: titleIndex,
          endOffset: titleIndex + title.length,
          level,
        });
        lastIndex = titleIndex;
      }
    }

    return sections;
  }

  /**
   * Check if this parser supports the MIME type
   */
  supports(mimeType: string): boolean {
    return (SUPPORTED_MIME_TYPES.DOCX as readonly string[]).includes(mimeType);
  }
}

/**
 * Factory function to create DOCX parser
 */
export function createDOCXParser(options?: ParserOptions): Parser {
  return new DOCXParser(options);
}
