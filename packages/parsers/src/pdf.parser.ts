import pdfParse from 'pdf-parse';
import PDFParser2 from 'pdf2json';
import { getDocumentProxy } from 'unpdf';
import { Parser, ParserOptions } from './types';
import { ParsedDocument, DocumentSection, SUPPORTED_MIME_TYPES } from '@task-platform/shared';

/**
 * PDF Parser
 * Extracts text from PDF documents with page tracking
 * Uses pdf-parse as primary parser with pdf2json and unpdf as fallbacks
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
    // Try pdf-parse first (fast and reliable for well-formed PDFs)
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
    } catch (pdfParseError: any) {
      // If pdf-parse fails, try pdf2json as fallback
      console.log(`pdf-parse failed: ${pdfParseError.message}, trying pdf2json...`);
      
      try {
        const pdfParser = new PDFParser2(null, true);
        const result = await new Promise<ParsedDocument>((resolve, reject) => {
          pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(new Error(`pdf2json error: ${errData.parserError}`));
          });

          pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            try {
              // Extract text from pdf2json data structure
              const pages = pdfData.Pages || [];
              let fullText = '';
              const sections: DocumentSection[] = [];

              pages.forEach((page: any, index: number) => {
                const texts = page.Texts || [];
                let pageText = '';

                texts.forEach((textObj: any) => {
                  if (textObj.R && textObj.R.length > 0) {
                    textObj.R.forEach((r: any) => {
                      if (r.T) {
                        const decoded = decodeURIComponent(r.T);
                        pageText += decoded + ' ';
                      }
                    });
                  }
                });

                pageText = pageText.trim();
                if (pageText) {
                  fullText += pageText + '\n\n';
                  sections.push({
                    title: `Page ${index + 1}`,
                    content: pageText,
                    startOffset: 0,
                    endOffset: pageText.length,
                    page: index + 1,
                  });
                }
              });

              if (!fullText || fullText.trim().length === 0) {
                reject(new Error('No text content extracted from PDF'));
              } else {
                resolve({
                  text: fullText.trim(),
                  sections: sections.length > 0 ? sections : undefined,
                  metadata: {
                    pageCount: pages.length,
                    wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
                  },
                });
              }
            } catch (error: any) {
              reject(error);
            }
          });

          pdfParser.parseBuffer(buffer);
        });

        console.log('✅ PDF parsed successfully using pdf2json fallback');
        return result;
      } catch (pdf2jsonError: any) {
        // Both parsers failed - try unpdf as final fallback
        console.log(`pdf2json failed: ${pdf2jsonError.message}, trying unpdf...`);
        
        try {
          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          const numPages = pdf.numPages;
          let fullText = '';
          const sections: DocumentSection[] = [];

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            let pageText = '';
            textContent.items.forEach((item: any) => {
              if (item.str) {
                pageText += item.str + ' ';
              }
            });

            pageText = pageText.trim();
            if (pageText) {
              fullText += pageText + '\n\n';
              sections.push({
                title: `Page ${pageNum}`,
                content: pageText,
                startOffset: 0,
                endOffset: pageText.length,
                page: pageNum,
              });
            }
          }

          console.log('✅ PDF parsed successfully using unpdf fallback');
          return {
            text: fullText.trim(),
            sections: sections.length > 0 ? sections : undefined,
            metadata: {
              pageCount: numPages,
              wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
            },
          };
        } catch (unpdfError: any) {
          // All parsers failed - provide helpful error message
          const errorMsg = `Unable to extract text from PDF. This may be due to:\n` +
            `- The PDF is image-based (scanned document) without text layer\n` +
            `- The PDF has non-standard encoding or is corrupted\n` +
            `- The PDF uses advanced features not supported by the parsers\n\n` +
            `Technical details:\n` +
            `- pdf-parse error: ${pdfParseError.message}\n` +
            `- pdf2json error: ${pdf2jsonError.message}\n` +
            `- unpdf error: ${unpdfError.message}`;
          throw new Error(errorMsg);
        }
      }
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
