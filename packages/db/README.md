# @task-platform/db

## Purpose
Database layer using Prisma ORM for PostgreSQL, providing type-safe data access and migrations.

## Responsibilities
- Prisma schema definition for all domain entities
- Database migrations
- Repository pattern for data access
- Database connection management
- Seed data for development

## Stack
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Migration**: Prisma Migrate

## Schema Overview

### Core Tables
- `runs` - Extraction runs
- `documents` - Uploaded files
- `tasks` - Extracted tasks with traceability
- `integration_targets` - External system configurations
- `task_sync_results` - Integration push results
- `export_artifacts` - Generated exports

### Relationships
- Run → Documents (1:many)
- Run → Tasks (1:many)
- Run → Export Artifacts (1:many)
- Task → Task Sync Results (1:many)
- Integration Target → Task Sync Results (1:many)

## Usage

### Initialize Database
```bash
npm run generate  # Generate Prisma client
npm run migrate   # Run migrations
npm run seed      # Seed development data
```

### Repository Pattern
```typescript
import { createRunRepository } from '@task-platform/db';

const runRepo = createRunRepository();
const run = await runRepo.create({
  inputType: 'TEXT',
  status: 'PENDING',
  // ...
});
```

## Development
```bash
npm run studio    # Open Prisma Studio (DB GUI)
npm run migrate   # Create and apply migration
```

## Design Principles
- Use Prisma's type generation for compile-time safety
- Keep database models close to domain models
- Use transactions for multi-table operations
- Soft deletes where appropriate
- Proper indexing for performance
