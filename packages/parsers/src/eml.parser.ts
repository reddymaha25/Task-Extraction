import { simpleParser, ParsedMail } from 'mailparser';
import { Parser, ParserOptions } from './types';
import { 
  ParsedDocument, 
  SUPPORTED_MIME_TYPES, 
  EMAIL_SIGNATURE_MARKERS,
  EMAIL_THREAD_MARKERS,
  EmailThread
} from '@task-platform/shared';
import { EmailThreadParser } from './email-thread.parser';

/**
 * EML Parser
 * Extracts text from email files with intelligent cleaning
 * Supports both simple parsing and thread-aware parsing
 */
export class EMLParser implements Parser {
  private options: Required<ParserOptions> & { parseThreads?: boolean };
  private threadParser: EmailThreadParser;

  constructor(options: ParserOptions & { parseThreads?: boolean } = {}) {
    this.options = {
      timeout: options.timeout ?? 30000,
      maxPages: options.maxPages ?? 1000,
      includeImages: options.includeImages ?? false,
      parseThreads: options.parseThreads ?? false,
    };
    this.threadParser = new EmailThreadParser();
  }

  /**
   * Parse EML buffer
   * Can parse as simple email or as a thread (with nested RFC822 attachments)
   */
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    try {
      // If thread parsing is enabled, try to parse as thread first
      if (this.options.parseThreads) {
        return await this.parseAsThread(buffer);
      }
      
      // Otherwise, use simple parsing
      return await this.parseSimple(buffer);
    } catch (error: any) {
      throw new Error(`EML parsing failed: ${error.message}`);
    }
  }
  
  /**
   * Parse as email thread (handles nested RFC822 messages)
   */
  private async parseAsThread(buffer: Buffer): Promise<ParsedDocument> {
    const thread = await this.threadParser.parseThread(buffer);
    
    return {
      text: thread.combinedText,
      metadata: {
        author: thread.messages[0].from.name || thread.messages[0].from.address,
        subject: thread.subject,
        createdDate: thread.startDate,
        wordCount: thread.combinedText.split(/\s+/).length,
        // Add thread-specific metadata
        threadMetadata: {
          messageCount: thread.messageCount,
          participants: thread.participants.map(p => p.name || p.address),
          threadingComplete: thread.metadata.threadingComplete,
          isSingleMessage: thread.metadata.isSingleMessage,
        },
      },
    };
  }
  
  /**
   * Parse as simple email (legacy behavior)
   */
  private async parseSimple(buffer: Buffer): Promise<ParsedDocument> {
    const parsed: ParsedMail = await simpleParser(buffer);

    // Get email body (prefer text, fallback to HTML)
    let bodyText = parsed.text || '';
    if (!bodyText && parsed.html) {
      bodyText = this.htmlToText(parsed.html.toString());
    }

    // Clean the email body
    const cleanedBody = this.cleanEmailBody(bodyText);

    // Build full text with subject
    const fullText = parsed.subject 
      ? `Subject: ${parsed.subject}\n\n${cleanedBody}`
      : cleanedBody;

    return {
      text: fullText,
      metadata: {
        author: parsed.from?.text,
        subject: parsed.subject,
        createdDate: parsed.date,
        wordCount: cleanedBody.split(/\s+/).length,
      },
    };
  }

  /**
   * Clean email body by removing signatures and quoted replies
   */
  private cleanEmailBody(body: string): string {
    let cleaned = body;

    // Remove quoted reply sections
    // Pattern 1: "On ... wrote:" style
    for (const marker of EMAIL_THREAD_MARKERS) {
      const regex = new RegExp(`${marker}[\\s\\S]*$`, 'mi');
      cleaned = cleaned.replace(regex, '');
    }

    // Remove signature sections
    // Look for signature markers
    for (const marker of EMAIL_SIGNATURE_MARKERS) {
      const index = cleaned.lastIndexOf(marker);
      if (index > cleaned.length * 0.5) { // Only if in bottom half
        cleaned = cleaned.substring(0, index);
      }
    }

    // Remove lines starting with ">" (quoted text)
    cleaned = cleaned
      .split('\n')
      .filter(line => !line.trim().startsWith('>'))
      .join('\n');

    // Remove excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/<br\s*\/?>/gi, '\n') // BR to newline
      .replace(/<\/p>/gi, '\n\n') // P to double newline
      .replace(/<\/div>/gi, '\n') // DIV to newline
      .replace(/<[^>]+>/g, '') // Remove all other tags
      .replace(/&nbsp;/g, ' ') // Convert &nbsp;
      .replace(/&lt;/g, '<') // Convert &lt;
      .replace(/&gt;/g, '>') // Convert &gt;
      .replace(/&amp;/g, '&') // Convert &amp;
      .replace(/&quot;/g, '"') // Convert &quot;
      .trim();
  }

  /**
   * Check if this parser supports the MIME type
   */
  supports(mimeType: string): boolean {
    return (SUPPORTED_MIME_TYPES.EML as readonly string[]).includes(mimeType);
  }
}

/**
 * Factory function to create EML parser
 */
export function createEMLParser(options?: ParserOptions): Parser {
  return new EMLParser(options);
}
