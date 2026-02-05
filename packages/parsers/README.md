# @task-platform/parsers

## Purpose
File parsing modules to extract text from various document formats (PDF, DOCX, EML).

## Responsibilities
- Parse PDF documents to text with page tracking
- Parse DOCX documents preserving structure
- Parse EML/email files with reply trimming
- Extract metadata from documents
- Handle parsing errors gracefully

## Supported Formats

### PDF
- **Library**: pdf-parse
- **Extracts**: Text, page count, metadata
- **Preserves**: Page numbers for traceability

### DOCX
- **Library**: mammoth
- **Extracts**: Text, headings, structure
- **Preserves**: Document sections

### EML (Email)
- **Library**: mailparser
- **Extracts**: Subject, body, attachments
- **Features**: Reply chain trimming, signature removal

## Usage

```typescript
import { createPDFParser, createDOCXParser, createEMLParser } from '@task-platform/parsers';

// Parse PDF
const pdfParser = createPDFParser();
const pdfResult = await pdfParser.parse(buffer);
console.log(pdfResult.text);
console.log(pdfResult.metadata.pageCount);

// Parse DOCX
const docxParser = createDOCXParser();
const docxResult = await docxParser.parse(buffer);
console.log(docxResult.sections);

// Parse EML
const emlParser = createEMLParser();
const emlResult = await emlParser.parse(buffer);
console.log(emlResult.text); // Cleaned body without replies
```

## Parser Interface

All parsers implement:

```typescript
interface Parser {
  parse(buffer: Buffer): Promise<ParsedDocument>;
  supports(mimeType: string): boolean;
}
```

## Output Format

```typescript
interface ParsedDocument {
  text: string;                    // Extracted text
  sections?: DocumentSection[];    // Optional structured sections
  metadata: DocumentMetadata;      // Document metadata
}
```

## Email Cleaning

The EML parser automatically:
- Removes quoted reply chains
- Strips email signatures
- Removes disclaimers
- Cleans HTML formatting
- Preserves important content

## Error Handling
- Timeout protection (30s default)
- Graceful degradation (partial text on error)
- Detailed error messages
- File size validation
