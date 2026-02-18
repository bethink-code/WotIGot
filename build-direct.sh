#!/bin/bash
set -e

echo "Building ScanSure for production (direct approach)..."

# Build frontend directly with expo CLI
echo "Building frontend..."
cd app
npm ci
# Set production API URL at build time (Expo embeds EXPO_PUBLIC_* at build time)
EXPO_PUBLIC_API_URL=/api npx expo export -p web
cd ..

# Build backend
echo "Building backend..."
cd api
npm ci
npm run build
cd ..

echo "Build complete!"
