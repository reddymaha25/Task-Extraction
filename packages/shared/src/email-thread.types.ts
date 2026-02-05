/**
 * Email Thread Types
 * Structures for representing email threads with proper threading relationships
 */

/**
 * Represents a single email in a thread
 */
export interface EmailMessage {
  /** Unique message identifier */
  messageId: string;
  
  /** Message-ID of the email this is replying to */
  inReplyTo?: string;
  
  /** Array of Message-IDs referenced in this email (for threading) */
  references: string[];
  
  /** Email subject */
  subject: string;
  
  /** Sender information */
  from: {
    name?: string;
    address: string;
  };
  
  /** Recipients */
  to: Array<{
    name?: string;
    address: string;
  }>;
  
  /** CC recipients */
  cc: Array<{
    name?: string;
    address: string;
  }>;
  
  /** Email sent date */
  date: Date;
  
  /** Email body (cleaned, without signatures/quotes) */
  body: string;
  
  /** Raw email body (unprocessed) */
  rawBody: string;
  
  /** Whether this is an attachment (nested message) */
  isAttachment: boolean;
  
  /** Position in the thread (0 = root, 1 = first reply, etc.) */
  depth: number;
  
  /** Any attachments (non-email files) */
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

/**
 * Represents a complete email thread
 */
export interface EmailThread {
  /** Root message ID (first email in thread) */
  rootMessageId: string;
  
  /** Thread subject (from root email, cleaned of Re:/Fwd: prefixes) */
  subject: string;
  
  /** All messages in the thread, ordered chronologically */
  messages: EmailMessage[];
  
  /** Thread participants (all unique email addresses) */
  participants: Array<{
    name?: string;
    address: string;
  }>;
  
  /** Thread start date (date of root message) */
  startDate: Date;
  
  /** Thread last updated date (date of most recent message) */
  lastDate: Date;
  
  /** Total number of messages in thread */
  messageCount: number;
  
  /** Combined text from all messages (for extraction) */
  combinedText: string;
  
  /** Threading metadata */
  metadata: {
    /** Whether thread structure was successfully parsed */
    threadingComplete: boolean;
    
    /** Any messages that couldn't be threaded */
    orphanedMessages: string[];
    
    /** Whether this was a single email or a thread */
    isSingleMessage: boolean;
  };
}

/**
 * Helper type for thread reconstruction
 */
export interface ThreadNode {
  message: EmailMessage;
  children: ThreadNode[];
  parent?: ThreadNode;
}
