#!/bin/bash

# Task Extraction Platform - Setup Script
# Run this after cloning the repository

set -e  # Exit on error

echo "🚀 Task Extraction Platform - Setup"
echo "===================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required (found: $(node -v))"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check PostgreSQL
echo ""
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  Warning: PostgreSQL not found. Install it to continue."
    echo "   macOS: brew install postgresql@14"
    echo "   Ubuntu: sudo apt-get install postgresql-14"
    exit 1
fi
echo "✅ PostgreSQL installed"

# Check Ollama (optional)
echo ""
echo "Checking Ollama (optional for open-source LLM)..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. Install it for open-source LLM support:"
    echo "   macOS: brew install ollama"
    echo "   Or configure OpenAI API key in .env"
else
    echo "✅ Ollama installed"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# Set up environment
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env with your configuration"
else
    echo "✅ .env file already exists"
fi

# Database setup
echo ""
echo "Setting up database..."
read -p "Enter PostgreSQL database name [task_extraction]: " DB_NAME
DB_NAME=${DB_NAME:-task_extraction}

read -p "Enter PostgreSQL user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASS
echo ""

# Create database
echo "Creating database $DB_NAME..."
PGPASSWORD=$DB_PASS createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database might already exist"

# Update .env with database URL
DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
else
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
fi
echo "✅ Database configured"

# Generate Prisma client and run migrations
echo ""
echo "Generating Prisma client and running migrations..."
cd packages/db
npm run generate
npm run migrate
cd ../..
echo "✅ Database schema created"

# Build packages
echo ""
echo "Building packages..."
npm run build
echo "✅ Packages built"

# Setup Ollama model (if installed)
if command -v ollama &> /dev/null; then
    echo ""
    read -p "Pull Ollama llama2 model? (y/N): " PULL_MODEL
    if [[ $PULL_MODEL =~ ^[Yy]$ ]]; then
        ollama pull llama2
        echo "✅ Ollama model downloaded"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env if needed (especially LLM configuration)"
echo "2. Start development: npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "For more information:"
echo "- Getting Started: docs/GETTING_STARTED.md"
echo "- API Docs: docs/API.md"
echo "- Development: docs/DEVELOPMENT.md"
echo ""
