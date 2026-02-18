#!/bin/bash
set -e

echo "Running database migrations..."
cd api
npm run migration:run
cd ..
echo "Migrations completed successfully!"
