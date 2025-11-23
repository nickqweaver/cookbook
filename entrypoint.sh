#!/bin/sh
# =============================================================================
# Container Entrypoint Script
# =============================================================================
# This script runs when the container starts.
# It ensures database migrations are applied before starting the app.
# =============================================================================

set -e  # Exit immediately if a command fails

echo "Running database migrations..."
npm run db:migrate

echo "Starting application..."
exec node .output/server/index.mjs
