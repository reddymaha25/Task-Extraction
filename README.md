# Task Extraction Platform POC

A production-ready platform for extracting actionable tasks from text, emails, and documents using LLM technology with human-in-the-loop review and traceability.

## Overview

This monorepo contains a complete task extraction and management system with:

- **Backend API** (Node.js/Express/TypeScript on port 4000)
- **React Frontend** (Vite/React Router/TailwindCSS with Premium UI on port 3001)
- **PostgreSQL Database** (Prisma ORM)
- **LLM Integration** (Ollama for open-source, Azure OpenAI support)
- **File Parsers** (PDF, DOCX, EML with multi-file support)
- **Export Capabilities** (Excel, CSV, JSON)
- **Integrations** (Jira, Asana, Microsoft Planner, Microsoft To Do, Webhook, Custom)

## Features

✅ Extract tasks from text, PDFs, documents, and emails  
✅ **Multi-file upload** - Process multiple emails simultaneously  
✅ Two-pass LLM extraction with validation  
✅ Confidence scoring for reliability  
✅ Source quote traceability (no quote = no task)  
✅ Intelligent date parsing (relative dates → ISO)  
✅ Stakeholder summaries (decisions, risks, asks)  
✅ Human review with edit capabilities  
✅ Export to Excel/CSV/JSON  
✅ Push to Jira/Asana/Microsoft To Do/Webhook  
✅ Task selection with checkboxes for targeted integration push  
✅ Email webhook ingestion  
✅ Deduplication and quality controls  
✅ Premium modern UI with glassmorphism  

## Architecture

```
Monorepo Structure:
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # React frontend
└── packages/
    ├── shared/       # Types, schemas, utilities
    ├── db/           # Prisma database layer
    ├── parsers/      # PDF/DOCX/EML parsers
    ├── extraction/   # LLM extraction pipeline
    ├── llm-providers # OpenAI & open-source LLM
    ├── exporters/    # Excel/CSV/JSON export
    └── integrations/ # Jira/Asana adapters
```

## Quick Start

### Automated Setup

```bash
# Run the setup script
./setup.sh
```

The script will:
- Check prerequisites (Node.js, PostgreSQL, Ollama)
- Install dependencies
- Configure environment variables
- Create database and run migrations
- Build all packages

### Manual Setup

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) for detailed instructions.

### Start Development

```bash
# Start both API and web servers
npm run dev
```

Open http://localhost:3001 to use the application.

## Usage Example

### Text Input
1. **Create a Run**: Navigate to "New Run" → "Paste Text"
2. **Paste meeting notes or email content**:
   ```
   Meeting Notes - Sprint Planning
   
   John, please complete the API documentation by Friday EOD.
   Sarah to review the security audit findings by next Tuesday.
   We decided to delay the feature release until after the holiday season.
   ```
3. **Extract Tasks**: Click "Extract Tasks" - the system processes with LLM
4. **Review Results**: See extracted tasks with confidence scores and source quotes
5. **Push to Integration**: Select tasks and push to Webhook, Jira, or other integrations

### Multi-File Upload (NEW! 🎉)
1. **Create a Run**: Navigate to "New Run" → "Upload File" tab
2. **Select Multiple Files**: Ctrl+Click or Cmd+Click to select multiple .eml, .pdf, or .docx files
3. **See File List**: View all selected files with names and sizes
4. **Process All**: Click "Extract Tasks" to process all files in one run
5. **Unified Results**: All tasks from all files are merged and displayed together

## Technology Stack

- **Backend**: Node.js, Express, TypeScript, Prisma (Port 4000)
- **Frontend**: React 18, Vite, TanStack Query, Tailwind CSS (Port 3001)
- **Database**: PostgreSQL
- **UI**: Premium design with custom color palette, animations, and glassmorphism effects
- **LLM**: Ollama (llama2/llama3) or OpenAI GPT-4
- **File Processing**: pdf-parse, mammoth, mailparser
- **Date Parsing**: chrono-node

## Documentation

- 📖 [Getting Started Guide](./docs/GETTING_STARTED.md) - Installation and setup
- 🏗️ [Architecture Overview](./docs/ARCHITECTURE.md) - System design and structure
- 🛠️ [Development Guide](./docs/DEVELOPMENT.md) - Contributing and workflow
- 📡 [API Documentation](./docs/API.md) - Complete API reference
- 🔌 [Integrations Guide](./docs/INTEGRATIONS.md) - Jira, Asana setup
- 🚀 [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## Project Structure

```
├── apps/
│   ├── api/                    # Backend Node.js/Express API (11 files)
│   └── web/                    # React frontend (14 files)
├── packages/
│   ├── shared/                 # Types, schemas, utilities (9 files)
│   ├── db/                     # Prisma database layer (6 files)
│   ├── parsers/                # PDF/DOCX/EML parsers (6 files)
│   ├── extraction/             # LLM extraction pipeline (5 files)
│   ├── llm-providers/          # OpenAI & Ollama providers (6 files)
│   ├── exporters/              # Excel/CSV/JSON export (5 files)
│   └── integrations/           # Jira/Asana adapters (5 files)
├── docs/                       # Comprehensive documentation
├── .env.example                # Environment template
├── setup.sh                    # Automated setup script
└── README.md                   # This file
```

## Key Design Principles

1. **Reliability First**: No quote = no task. No guessing.
2. **Traceability**: Every task links back to source text
3. **Transparency**: Confidence scores for quality assessment
4. **Human-in-Loop**: Review and edit before export/push
5. **Modular Design**: Clean separation of concerns across packages
6. **Type Safety**: End-to-end TypeScript with Zod validation

## Development Workflow

```bash
# Start both servers in watch mode
npm run dev

# Or individually
npm run dev:api   # API on :3001
npm run dev:web   # Web on :3000

# Build all packages
npm run build

# Database operations
cd packages/db
npm run migrate   # Run migrations
npm run generate  # Generate Prisma client
```

## Milestones Implemented

- ✅ **Milestone A**: Basic text extraction with LLM
- ✅ **Milestone B**: File uploads (PDF, DOCX, EML)
- ✅ **Milestone C**: Human review and exports (Excel, CSV)
- ✅ **Milestone D**: Integrations (Jira, Asana)
- ✅ **Milestone E**: Email webhooks

- ✅ **Milestone A**: Text → JSON tasks extraction
- ✅ **Milestone B**: File upload support (PDF/DOCX/EML)
- ✅ **Milestone C**: Review, edit, and export
- ✅ **Milestone D**: Integration adapters
- ✅ **Milestone E**: Webhook ingestion

## License

MIT
