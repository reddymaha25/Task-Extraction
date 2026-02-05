#!/bin/bash

# Task Extraction Platform - Distribution Package Creator
# This script creates a clean distribution zip ready for sharing

echo "📦 Creating distribution package..."

# Get the project directory name
PROJECT_DIR=$(basename "$PWD")
PARENT_DIR=$(dirname "$PWD")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="task-extraction-platform_${TIMESTAMP}.zip"

# Create zip excluding unnecessary files
cd "$PARENT_DIR"
zip -r "$ZIP_NAME" "$PROJECT_DIR" \
  -x "*/node_modules/*" \
  -x "*/.git/*" \
  -x "*/uploads/*" \
  -x "*/exports/*" \
  -x "*/.env" \
  -x "*.log" \
  -x "*/.DS_Store" \
  -x "*/dist/*" \
  -x "*/build/*" \
  -x "*/coverage/*" \
  -x "*.tsbuildinfo" \
  -x "*/.vscode/*" \
  -x "*/.idea/*" \
  -x "*/tmp/*" \
  -x "*/temp/*"

echo ""
echo "✅ Distribution package created: $ZIP_NAME"
echo "📊 Package size: $(du -h "$ZIP_NAME" | cut -f1)"
echo ""
echo "📋 Next steps:"
echo "  1. Share the zip file: $PARENT_DIR/$ZIP_NAME"
echo "  2. Recipients should unzip and run: npm install"
echo "  3. Setup database and configure .env"
echo "  4. Run: npm run dev"
echo ""
