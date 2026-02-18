#!/bin/bash
set -e

# Build version: 2024-12-02-v2 (forces fresh deployment cache)
echo "Building ScanSure for production..."

# Build frontend (Expo web)
echo "Building frontend..."
cd app
npm ci
# Set EXPO_PUBLIC_API_URL at build time - this is required for the frontend to know the API path
EXPO_PUBLIC_API_URL=/api npm run build:web
cd ..

# Build backend (NestJS)
echo "Building backend..."
cd api
npm ci
npm run build
cd ..

echo "Build complete!"
echo ""
echo "NOTE: Database migrations are NOT run automatically."
echo "Run migrations manually before deploying if schema changes exist:"
echo "  cd api && PROD_DATABASE_URL=\$PROD_DATABASE_URL DEV_DATABASE_URL=\$PROD_DATABASE_URL npm run migration:run"
