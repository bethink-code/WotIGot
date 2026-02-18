#!/bin/bash
set -e

# Force production environment for autoscale deployment
export NODE_ENV=production
export PORT=${PORT:-5000}
export BASE_PATH=/api
export EXPO_PUBLIC_API_URL=/api

echo "=== PRODUCTION STARTUP ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "PROD_DATABASE_URL set: $([ -n "$PROD_DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "=========================="

cd api
exec npm run start:prod
