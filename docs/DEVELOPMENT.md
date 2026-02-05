# Task Extraction Platform - Development Guide

## Project Overview

This is a comprehensive monorepo containing a full-stack task extraction platform built with:
- **Backend**: Node.js/Express/TypeScript/Prisma/PostgreSQL
- **Frontend**: React/TypeScript/Vite/TailwindCSS
- **LLM Integration**: Ollama (open-source) and OpenAI support
- **Packages**: Modular design with 7 internal packages

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database and LLM configuration

# Set up database
cd packages/db
npm run generate
npm run migrate
cd ../..

# Build all packages
npm run build

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Development Workflow

### Making Changes

1. **Make code changes** in the relevant package
2. **Rebuild if needed**: `npm run build` (or use watch mode)
3. **Test manually** through the UI or API
4. **Commit changes** with descriptive messages

### Working with Packages

Each package is independent:

```bash
# Work on a specific package
cd packages/extraction
npm run watch  # Auto-rebuild on changes

# In another terminal
cd apps/api
npm run dev    # API will use rebuilt package
```

### Database Changes

```bash
cd packages/db

# Create migration
npx prisma migrate dev --name add_new_field

# Regenerate client
npm run generate
```

### Adding Dependencies

```bash
# Add to root (affects all packages)
npm install <package> -w root

# Add to specific workspace
npm install <package> -w packages/parsers
npm install <package> -w apps/api
```

## Testing

### Manual Testing Flow

1. **Create a run**: 
   - Navigate to `/new`
   - Paste sample text or upload a file
   - Click "Extract Tasks"

2. **Verify extraction**:
   - Check tasks have source quotes
   - Verify confidence scores
   - Check date resolution

3. **Test export**:
   - Click "Export Excel" or "Export CSV"
   - Verify file downloads correctly

4. **Test integration** (if configured):
   - Configure Jira/Asana credentials
   - Push tasks
   - Verify creation in external system

### Sample Test Data

```
Meeting Notes - Sprint Planning

John, please complete the API documentation by Friday EOD.

Sarah to review the security audit findings by next Tuesday.

We decided to delay the feature release until after the holiday season.

Mike needs to investigate the performance issues in the dashboard - this is blocking the demo.

Action item: everyone to submit their Q2 goals by Feb 15.
```

## Common Tasks

### Add a New Parser

1. Create `packages/parsers/src/newformat.parser.ts`
2. Implement `Parser` interface
3. Add to `getParser()` function
4. Update SUPPORTED_MIME_TYPES

### Add a New Integration

1. Create `packages/integrations/src/adapters/newservice.adapter.ts`
2. Implement `IntegrationAdapter` interface
3. Add to `createIntegrationAdapter()` factory
4. Test connection and task creation

### Modify Extraction Logic

1. Update `packages/extraction/src/extraction.service.ts`
2. Modify pipeline steps or add new processing
3. Rebuild and test extraction

### Add New API Endpoint

1. Create route in `apps/api/src/routes/`
2. Add validation schema in `packages/shared/src/schemas.ts`
3. Import and mount in `apps/api/src/index.ts`

### Add Frontend Page

1. Create component in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.tsx`
3. Add API calls in `apps/web/src/api/client.ts`

## Troubleshooting

### "Module not found" errors

```bash
# Rebuild packages
npm run build

# Clear and reinstall
rm -rf node_modules
npm install
```

### Database connection issues

```bash
# Check PostgreSQL is running
pg_isready

# Verify .env DATABASE_URL
# Regenerate Prisma client
cd packages/db
npm run generate
```

### LLM not responding

```bash
# For Ollama
ollama list  # Check model is installed
ollama serve # Ensure server is running

# For OpenAI
# Verify OPENAI_API_KEY in .env
```

### Build failures

```bash
# Clean all builds
find . -name 'dist' -type d -exec rm -rf {} +
find . -name 'node_modules' -type d -prune -exec rm -rf {} +

# Fresh install
npm install
npm run build
```

## Code Style

- Use TypeScript strict mode
- Follow existing patterns in each package
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/add-planner-integration

# Make changes and commit
git add .
git commit -m "Add Microsoft Planner integration adapter"

# Push and create PR
git push origin feature/add-planner-integration
```

## Performance Tips

- Use `npm run build` once, then `npm run watch` for development
- Database queries are already optimized with indexes
- File uploads are streamed, not buffered
- LLM calls use retry logic and timeouts

## Security Notes

- Never commit `.env` file
- Keep API keys in environment variables
- Validate all user inputs (Zod schemas)
- Sanitize file names on upload
- Rate limiting is enabled by default

## Documentation

Each package has a README explaining:
- Purpose and responsibilities
- API/interfaces
- Usage examples
- Design principles

## Getting Help

- Check package READMEs first
- Review API.md for endpoint documentation
- Look at existing code for patterns
- Check error messages and logs

## Next Steps

1. ✅ **POC Complete**: All milestones implemented
2. 🔄 **Add Features**: Authentication, webhooks, more integrations
3. 📊 **Monitoring**: Add logging and metrics
4. 🧪 **Testing**: Unit and integration tests
5. 🚀 **Deploy**: Use deployment guide for production

## File Locations Reference

- **Types**: `packages/shared/src/types.ts`
- **API Schemas**: `packages/shared/src/schemas.ts`
- **Database Schema**: `packages/db/prisma/schema.prisma`
- **API Routes**: `apps/api/src/routes/`
- **React Pages**: `apps/web/src/pages/`
- **LLM Prompts**: `packages/llm-providers/src/prompts.ts`
