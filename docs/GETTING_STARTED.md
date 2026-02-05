# Getting Started Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 24+ and npm 9+
- **PostgreSQL** 14+
- **Ollama** (for local LLM) or Azure OpenAI API credentials

### System Requirements
- **RAM**: 4GB minimum (for LLM processing)
- **Disk Space**: 5GB minimum
- **OS**: macOS, Linux, or Windows with WSL2

## Installation

### 1. Install Dependencies

```bash
# Clone or navigate to the project directory
cd /path/to/EDE

# Install all dependencies (monorepo + workspaces)
npm install
```

This installs dependencies for:
- Root workspace
- API server (`apps/api`)
- Web frontend (`apps/web`)
- All packages (`packages/*`)

### 2. Set Up Database

Create a PostgreSQL database:

```bashconfigure:

```bash
cp .env.example .env
```

**Edit `.env`** with your configuration:

```env
# Database (update with your PostgreSQL credentials)
DATABASE_URL=postgresql://your_user@localhost:5432/task_extraction

# Server
PORT=4000
NODE_ENV=development

# LLM Configuration (choose one provider)
DEFAULT_LLM_PROVIDER=OPEN_SOURCE

# Option 1: Open-source LLM (Ollama) - Recommended for local development
OPEN_LLM_BASE_URL=http://localhost:11434
OPEN_LLM_MODEL=llama2

# Option 2: Azure OpenAI (for production)
# DEFAULT_LLM_PROVIDER=AZURE_OPENAI
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_API_KEY=your-api-key
# AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
# AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Integrations (optional)
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://webhook.site/your-unique-id
JIRA_ENABLED=false
ASANA_ENABLED=falsma)
OPEN_LLM_BASE_URL=http://localhost:11434
OPEN_LLM_MODEL=llama2

# Option 2: OpenAI (if you prefer)
# DEFAULT_LLM_PROVIDER=OPENAI
# OPENAI_API_KEY=your-api-key-here
```

### 4. Set Up Ollama (Open-Source LLM)

If using open-source LLMs:

```bash
# Install Ollama (macOS)
brew install ollama
# From project root
cd packages/db
npx prisma generate
npx prisma migrate deploy
cd ../..
```

Or use the quick command:
```bash
npm run db:migrate
```

**Verify database setup:**
```bash
# Check connection
psql -U your_user -d task_extraction -c "\dt"

# You should see tables: Run, Task, Document, etc
# Pull a model (in another terminal)
ollama pull llama2
```

### 5. Initialize Database

Generate Prisma client and run migrations:

```bash
cd packages/db
npm run generate
npm run migrate
cd ../..
```

### 6. Build Packages

Build all TypeScript packages:

```bash
npm run build
```

## Running the Application

### Development Mode

Start both API and web servers in development mode:

```bash
npm run dev
```

This starts:
- API server on http://localhost:4000
- Web app on http://localhost:3001

### Individual Services

Start services separately:

```bash
# API only
npm run dev:api

# Web only
npm run dev:web
```

## First Run

1. **Open the application**: http://localhost:3001 in your browser
2. **Click "New Run"**
3. **Try Text Input**:
   - Select "Paste Text" tab
   - Paste sample text:
     ```
     Meeting Notes - Q1 Planning
     
     Rayan, please finalize the dashboard by next Friday.
     Alex to confirm data source access by Feb 10.
     Sarah should review the security audit findings by end of week.
     ```
   - Click "Extract Tasks"

4. **Try Multi-File Upload** (NEW! 🎉):
   - Select "Upload File" tab
   - Click the file input
   - Select **multiple .eml files** (Ctrl+Click or Cmd+Click)
   - See the list of selected files
   - Click "Extract Tasks"
   - All tasks from all files will be processed and merged!

5. **Review Results**:
   - View extracted tasks with confidence scores
   - See source quotes for each task
   - Check normalized dates and owners

brew services list | grep postgresql
# or
pg_isready

# Verify database exists
psql -U your_user -l | grep task_extraction

# If database doesn't exist, create it
createdb -U your_user task_extraction

# Check DATABASE_URL in .env matches your setup
cat .env | grep DATABASE_URL
## Troubleshooting

### Database Connection Issues

If you see database errors:

```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
# Make sure the database exists
psql -l | grep task_extraction
```

### LLM Connection Issues

If extraction fails:

```bash
# For Ollama
curl http://localhost:11434/api/generate -d '{"model":"llama2","prompt":"test"}'

# Check Ollama logs
ollama logs
```

### Build Errors

If TypeScript builds fail:

```bash
# Clean and rebuild
npm run c4000 or 3001 are already in use:

```bash
# Find process using port 4000 (API)
lsof -ti:4000

# Kill the process if needed
kill -9 $(lsof -ti:4000)

# Or change the port in .env
# Edit .env:
PORT=4001  # Change API port
```

For the web app port, edit `apps/web/vite.config.ts`:
```typescript
server: {
  port: 3002,  // Change from 3001
```env
# In .env
PORT=3002  # Change API port

# In apps/web/vite.config.ts
server: {
  port: 3001,  # Change web port
}
```

## Next Steps

- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Integration Guide](./INTEGRATIONS.md)
- [Deployment Guide](./DEPLOYMENT.md)
