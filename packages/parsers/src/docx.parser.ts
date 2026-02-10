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
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty or invalid buffer provided');
      }

      // Extract plain text
      const textResult = await mammoth.extractRawText({ buffer });
      const text = textResult.value;

      if (!text || text.trim().length === 0) {
        throw new Error('No text content extracted from DOCX file');
      }

      // Extract with HTML to get structure (headings, etc.)
      const htmlResult = await mammoth.convertToHtml({ buffer });
      const sections = this.extractSections(htmlResult.value, text);

      // Log any warnings from mammoth
      if (textResult.messages && textResult.messages.length > 0) {
        console.log('DOCX parsing warnings:', textResult.messages.map(m => m.message).join(', '));
      }

      return {
        text,
        sections: sections.length > 0 ? sections : undefined,
        metadata: {
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        },
      };
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.message.includes('End of central directory record')) {
        throw new Error('DOCX file is corrupted or not a valid ZIP archive');
      } else if (error.message.includes('ENOENT')) {
        throw new Error('DOCX file not found or inaccessible');
      } else {
        throw new Error(`DOCX parsing failed: ${error.message}`);
      }
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
