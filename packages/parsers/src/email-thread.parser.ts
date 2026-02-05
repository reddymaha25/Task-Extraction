import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
import { EmailThread, EmailMessage } from '@task-platform/shared';

/**
 * Email Thread Parser
 * Parses .eml files containing nested RFC822 messages (email threads)
 */
export class EmailThreadParser {
  /**
   * Parse an .eml file that may contain a thread of nested emails
   */
  async parseThread(buffer: Buffer): Promise<EmailThread> {
    const rootEmail = await simpleParser(buffer);
    
    // Collect all messages (root + any RFC822 attachments)
    const messages: EmailMessage[] = [];
    
    // Parse root message
    const rootMessage = await this.parseEmailMessage(rootEmail, false, 0);
    messages.push(rootMessage);
    
    // Parse nested RFC822 attachments recursively
    if (rootEmail.attachments && rootEmail.attachments.length > 0) {
      for (const attachment of rootEmail.attachments) {
        if (this.isRFC822Attachment(attachment)) {
          const nestedMessages = await this.parseNestedEmail(attachment, 1);
          messages.push(...nestedMessages);
        }
      }
    }
    
    // Build thread structure
    return this.buildThread(messages);
  }
  
  /**
   * Parse a single email message
   */
  private async parseEmailMessage(
    parsed: ParsedMail,
    isAttachment: boolean,
    depth: number
  ): Promise<EmailMessage> {
    // Extract body text
    let bodyText = parsed.text || '';
    if (!bodyText && parsed.html) {
      bodyText = this.htmlToText(parsed.html.toString());
    }
    
    // Clean body (remove signatures and quoted text)
    const cleanedBody = this.cleanEmailBody(bodyText);
    
    // Extract message headers
    const messageId = this.extractMessageId(parsed);
    const inReplyTo = this.extractInReplyTo(parsed);
    const references = this.extractReferences(parsed);
    
    return {
      messageId,
      inReplyTo,
      references,
      subject: parsed.subject || '(No Subject)',
      from: this.parseAddress(parsed.from),
      to: this.parseAddressList(parsed.to),
      cc: this.parseAddressList(parsed.cc),
      date: parsed.date || new Date(),
      body: cleanedBody,
      rawBody: bodyText,
      isAttachment,
      depth,
      attachments: this.extractNonEmailAttachments(parsed.attachments || []),
    };
  }
  
  /**
   * Parse nested RFC822 email attachment
   */
  private async parseNestedEmail(
    attachment: Attachment,
    depth: number
  ): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];
    
    try {
      const nestedEmail = await simpleParser(attachment.content);
      const message = await this.parseEmailMessage(nestedEmail, true, depth);
      messages.push(message);
      
      // Recursively parse any nested attachments
      if (nestedEmail.attachments && nestedEmail.attachments.length > 0) {
        for (const nestedAttachment of nestedEmail.attachments) {
          if (this.isRFC822Attachment(nestedAttachment)) {
            const deeperMessages = await this.parseNestedEmail(nestedAttachment, depth + 1);
            messages.push(...deeperMessages);
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to parse nested email: ${error.message}`);
    }
    
    return messages;
  }
  
  /**
   * Build thread structure from individual messages
   */
  private buildThread(messages: EmailMessage[]): EmailThread {
    // Sort messages chronologically
    messages.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Find root message (earliest message without In-Reply-To)
    const rootMessage = messages.find(m => !m.inReplyTo) || messages[0];
    
    // Clean subject (remove Re:, Fwd: prefixes)
    const cleanSubject = this.cleanSubject(rootMessage.subject);
    
    // Collect all unique participants
    const participantMap = new Map<string, { name?: string; address: string }>();
    for (const message of messages) {
      participantMap.set(message.from.address.toLowerCase(), message.from);
      for (const recipient of [...message.to, ...message.cc]) {
        participantMap.set(recipient.address.toLowerCase(), recipient);
      }
    }
    
    // Build threading metadata
    const threadedMessages = new Set<string>();
    const orphanedMessages: string[] = [];
    
    for (const message of messages) {
      if (message.messageId) {
        threadedMessages.add(message.messageId);
      }
      
      // Check if message can be threaded
      if (message.inReplyTo && !messages.find(m => m.messageId === message.inReplyTo)) {
        orphanedMessages.push(message.messageId);
      }
    }
    
    // Combine all message bodies for extraction
    const combinedText = messages
      .map(m => {
        const header = `\n--- Message from ${m.from.name || m.from.address} on ${m.date.toISOString()} ---\n`;
        const subject = m.subject ? `Subject: ${m.subject}\n` : '';
        return `${header}${subject}${m.body}`;
      })
      .join('\n\n');
    
    return {
      rootMessageId: rootMessage.messageId,
      subject: cleanSubject,
      messages,
      participants: Array.from(participantMap.values()),
      startDate: messages[0].date,
      lastDate: messages[messages.length - 1].date,
      messageCount: messages.length,
      combinedText,
      metadata: {
        threadingComplete: orphanedMessages.length === 0,
        orphanedMessages,
        isSingleMessage: messages.length === 1,
      },
    };
  }
  
  /**
   * Extract Message-ID header
   */
  private extractMessageId(parsed: ParsedMail): string {
    const messageId = parsed.messageId || parsed.headers.get('message-id') as string;
    return messageId || `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Extract In-Reply-To header
   */
  private extractInReplyTo(parsed: ParsedMail): string | undefined {
    const inReplyTo = parsed.inReplyTo || parsed.headers.get('in-reply-to') as string;
    if (!inReplyTo) return undefined;
    
    // Clean up the message ID (remove < > if present)
    return inReplyTo.replace(/[<>]/g, '').trim();
  }
  
  /**
   * Extract References header (thread ancestry)
   */
  private extractReferences(parsed: ParsedMail): string[] {
    const references = parsed.references || parsed.headers.get('references');
    if (!references) return [];
    
    if (Array.isArray(references)) {
      return references.map(ref => String(ref).replace(/[<>]/g, '').trim());
    }
    
    if (typeof references === 'string') {
      return references
        .split(/\s+/)
        .map(ref => ref.replace(/[<>]/g, '').trim())
        .filter(ref => ref.length > 0);
    }
    
    return [];
  }
  
  /**
   * Parse a single email address
   */
  private parseAddress(addressObj: AddressObject | undefined): { name?: string; address: string } {
    if (!addressObj || !addressObj.value || addressObj.value.length === 0) {
      return { address: 'unknown@unknown.com' };
    }
    
    const addr = addressObj.value[0];
    return {
      name: addr.name || undefined,
      address: addr.address || 'unknown@unknown.com',
    };
  }
  
  /**
   * Parse a list of email addresses
   */
  private parseAddressList(addressObj: AddressObject | AddressObject[] | undefined): Array<{ name?: string; address: string }> {
    if (!addressObj) return [];
    
    const addresses: AddressObject[] = Array.isArray(addressObj) ? addressObj : [addressObj];
    const result: Array<{ name?: string; address: string }> = [];
    
    for (const addr of addresses) {
      if (addr.value) {
        for (const val of addr.value) {
          result.push({
            name: val.name || undefined,
            address: val.address || 'unknown@unknown.com',
          });
        }
      }
    }
    
    return result;
  }
  
  /**
   * Check if attachment is an RFC822 message
   */
  private isRFC822Attachment(attachment: Attachment): boolean {
    return (
      attachment.contentType === 'message/rfc822' ||
      attachment.contentType.startsWith('message/rfc822')
    );
  }
  
  /**
   * Extract non-email attachments
   */
  private extractNonEmailAttachments(attachments: Attachment[]): Array<{ filename: string; contentType: string; size: number }> {
    return attachments
      .filter(att => !this.isRFC822Attachment(att))
      .map(att => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size,
      }));
  }
  
  /**
   * Clean email subject (remove Re:, Fwd:, etc.)
   */
  private cleanSubject(subject: string): string {
    return subject
      .replace(/^(Re|RE|Fwd|FWD|Fw|FW):\s*/gi, '')
      .trim();
  }
  
  /**
   * Clean email body (remove signatures and quoted text)
   */
  private cleanEmailBody(body: string): string {
    let cleaned = body;
    
    // Remove quoted reply sections (On ... wrote:)
    const replyMarkers = [
      /On .*wrote:/mi,
      /From:.*Sent:/mi,
      /-----Original Message-----/mi,
      /________________________________/m,
    ];
    
    for (const marker of replyMarkers) {
      const match = cleaned.match(marker);
      if (match && match.index !== undefined) {
        cleaned = cleaned.substring(0, match.index);
      }
    }
    
    // Remove signature sections
    const signatureMarkers = ['-- ', 'Best regards', 'Regards', 'Thanks', 'Cheers'];
    for (const marker of signatureMarkers) {
      const index = cleaned.lastIndexOf(marker);
      if (index > cleaned.length * 0.5) {
        cleaned = cleaned.substring(0, index);
      }
    }
    
    // Remove quoted lines (starting with >)
    cleaned = cleaned
      .split('\n')
      .filter(line => !line.trim().startsWith('>'))
      .join('\n');
    
    // Remove excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }
  
  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

/**
 * Factory function to create email thread parser
 */
export function createEmailThreadParser(): EmailThreadParser {
  return new EmailThreadParser();
}
