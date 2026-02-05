# Deployment Guide

## Production Deployment

### Prerequisites

- Node.js 18+ runtime environment
- PostgreSQL 14+ database
- Domain name and SSL certificate
- LLM access (Ollama server or OpenAI API key)

## Option 1: Docker Deployment (Recommended)

### 1. Create Dockerfile

Create `Dockerfile` in the root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create directories
RUN mkdir -p uploads exports

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
```

### 2. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: task_extraction
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: changeme
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"

  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://taskuser:changeme@postgres:5432/task_extraction
      OPEN_LLM_BASE_URL: http://ollama:11434
      NODE_ENV: production
    depends_on:
      - postgres
      - ollama
    volumes:
      - ./uploads:/app/uploads
      - ./exports:/app/exports

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres_data:
  ollama_data:
```

### 3. Deploy

```bash
docker-compose up -d
```

## Option 2: Cloud Platform Deployment

### Render.com

1. **Database**: Create PostgreSQL database
2. **API Service**:
   - Build command: `npm install && npm run build`
   - Start command: `node apps/api/dist/index.js`
   - Environment variables: DATABASE_URL, OPENAI_API_KEY, etc.

3. **Web Service**:
   - Build command: `cd apps/web && npm install && npm run build`
   - Static site from `apps/web/dist`

### Heroku

```bash
# Create app
heroku create task-extraction-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### AWS

Use AWS Elastic Beanstalk or ECS:

1. **RDS**: PostgreSQL database
2. **Elastic Beanstalk**: Node.js application
3. **S3**: Store uploads and exports
4. **CloudFront**: Serve frontend

## Environment Variables for Production

```env
# Server
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# LLM (choose one)
DEFAULT_LLM_PROVIDER=OPENAI
OPENAI_API_KEY=sk-...

# Security
JWT_SECRET=strong-random-secret
CORS_ORIGIN=https://yourdomain.com
WEBHOOK_SECRET=strong-random-secret

# File Storage
UPLOAD_DIR=/var/app/uploads
EXPORT_DIR=/var/app/exports
MAX_FILE_SIZE_MB=50

# Integrations (optional)
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=bot@company.com
JIRA_API_TOKEN=...
```

## Database Migrations

Run migrations in production:

```bash
cd packages/db
npx prisma migrate deploy
```

## Monitoring & Logging

### Recommended Tools

- **Application Monitoring**: DataDog, New Relic
- **Error Tracking**: Sentry
- **Logging**: Winston + CloudWatch/Loggly

### Health Check

```bash
curl https://api.yourdomain.com/health
```

## Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Set strong JWT_SECRET and WEBHOOK_SECRET
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Encrypt database at rest
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Implement request logging
- [ ] Add authentication (JWT/OAuth)

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (ALB, nginx)
- Scale API instances based on CPU/memory
- Use Redis for session storage
- Consider queue system for async processing (Bull, BullMQ)

### Database Optimization

- Connection pooling (configured in Prisma)
- Read replicas for heavy loads
- Database indexes (already in schema)

### File Storage

For production, use cloud storage:

```typescript
// Replace local file storage with S3
import { S3 } from 'aws-sdk';

const s3 = new S3();
await s3.upload({
  Bucket: 'task-platform-uploads',
  Key: fileId,
  Body: fileBuffer,
}).promise();
```

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
pg_dump task_extraction | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-*.sql.gz s3://backups/database/
```

### Application State

- Uploads and exports should be in S3
- Database backups automated via RDS or managed service

## Rollback Procedure

```bash
# Rollback database migration
cd packages/db
npx prisma migrate resolve --rolled-back migration_name

# Rollback application
git revert <commit>
git push heroku main
```
