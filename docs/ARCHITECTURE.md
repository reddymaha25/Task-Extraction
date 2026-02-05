# Project Structure

```
task-extraction-platform/
├── apps/
│   ├── api/                    # Backend Node.js/Express API
│   │   ├── src/
│   │   │   ├── config/        # Configuration
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── routes/        # API route handlers
│   │   │   └── index.ts       # Server entry point
│   │   └── package.json
│   │
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── api/           # API client
│       │   ├── pages/         # React pages/routes
│       │   ├── App.tsx        # Root component
│       │   └── main.tsx       # Entry point
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types and utilities
│   │   ├── src/
│   │   │   ├── enums.ts       # Enums (InputType, Status, etc.)
│   │   │   ├── types.ts       # Domain types (Run, Task, etc.)
│   │   │   ├── schemas.ts     # Zod validation schemas
│   │   │   ├── constants.ts   # Shared constants
│   │   │   └── utils.ts       # Utility functions
│   │   └── README.md
│   │
│   ├── db/                     # Database layer (Prisma)
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   │   ├── src/
│   │   │   ├── client.ts      # Prisma client
│   │   │   └── repositories/  # Repository pattern
│   │   └── README.md
│   │
│   ├── parsers/                # File parsers (PDF/DOCX/EML)
│   │   ├── src/
│   │   │   ├── pdf.parser.ts
│   │   │   ├── docx.parser.ts
│   │   │   └── eml.parser.ts
│   │   └── README.md
│   │
│   ├── extraction/             # Extraction pipeline
│   │   ├── src/
│   │   │   ├── extraction.service.ts  # Main orchestration
│   │   │   ├── utils.ts               # Text cleaning, date parsing
│   │   │   └── deduplication.ts       # Task deduplication
│   │   └── README.md
│   │
│   ├── llm-providers/          # LLM integrations
│   │   ├── src/
│   │   │   ├── types.ts       # Provider interface
│   │   │   ├── prompts.ts     # Prompt templates
│   │   │   └── providers/
│   │   │       ├── opensource.provider.ts  # Ollama
│   │   │       └── openai.provider.ts      # OpenAI
│   │   └── README.md
│   │
│   ├── exporters/              # Export modules
│   │   ├── src/
│   │   │   ├── excel.exporter.ts
│   │   │   ├── csv.exporter.ts
│   │   │   └── json.exporter.ts
│   │   └── README.md
│   │
│   └── integrations/           # External integrations
│       ├── src/
│       │   ├── types.ts       # Adapter interface
│       │   └── adapters/
│       │       ├── jira.adapter.ts
│       │       └── asana.adapter.ts
│       └── README.md
│
├── docs/                       # Documentation
│   ├── GETTING_STARTED.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── INTEGRATIONS.md
│
├── .env.example                # Environment variables template
├── .gitignore
├── package.json                # Root package.json (workspaces)
├── tsconfig.json               # Root TypeScript config
└── README.md                   # Project overview
```

## Key Design Patterns

### Repository Pattern (Database)
- Separates data access logic from business logic
- Located in `packages/db/src/repositories/`
- Converts between Prisma models and domain types

### Provider Pattern (LLM)
- Common interface for multiple LLM backends
- Allows switching between open-source and OpenAI
- Located in `packages/llm-providers/`

### Service Pattern (Extraction)
- Orchestrates complex business logic
- Coordinates between parsers, LLM, and database
- Located in `packages/extraction/`

### Adapter Pattern (Integrations)
- Uniform interface for different external systems
- Maps domain tasks to external format
- Located in `packages/integrations/`

## Data Flow

```
1. User Input → Frontend (React)
2. Upload/Text → API (Express)
3. Create Run → Database (Prisma/PostgreSQL)
4. Parse File → Parsers Package
5. Extract Tasks → Extraction Service
6. LLM Calls → LLM Provider (Ollama/OpenAI)
7. Validate & Process → Extraction Pipeline
8. Save Tasks → Database
9. Display Results → Frontend
10. Export/Integrate → Exporters/Integrations
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: PostgreSQL + Prisma ORM
- **File Parsing**: pdf-parse, mammoth, mailparser
- **LLM**: Ollama (default) or OpenAI
- **Date Parsing**: chrono-node
- **Validation**: Zod

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **State**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

### DevOps
- **Monorepo**: npm workspaces
- **Type Checking**: TypeScript 5
- **Linting**: ESLint
- **Formatting**: Prettier

## Package Dependencies

```
apps/api
├── All internal packages
├── express, cors, helmet
├── multer (file uploads)
└── dotenv

apps/web
├── react, react-dom
├── @tanstack/react-query
├── axios
└── tailwindcss

packages/shared
└── zod (validation)

packages/db
└── @prisma/client

packages/parsers
├── pdf-parse
├── mammoth
└── mailparser

packages/extraction
├── chrono-node
└── Internal packages

packages/llm-providers
├── axios
└── openai

packages/exporters
├── exceljs
└── csv-stringify

packages/integrations
└── axios
```
