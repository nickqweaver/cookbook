#!/bin/sh
# =============================================================================
# Container Entrypoint Script
# =============================================================================
# This script runs when the container starts.
# It fixes data directory permissions, runs migrations, then starts the app.
#
# Why run as root first?
# - On Linux, bind-mounted volumes inherit host permissions
# - The host user's UID often doesn't match the container user (1001)
# - We fix ownership as root, then drop to the non-root user for security
# =============================================================================

set -e  # Exit immediately if a command fails

# Fix ownership of the data directory if running as root
# This handles the Linux bind mount permission issue
if [ "$(id -u)" = "0" ]; then
  echo "Fixing data directory permissions..."
  chown -R cookbook:nodejs /app/data
  
  echo "Dropping to non-root user..."
  exec su-exec cookbook "$0" "$@"
fi

# From here on, we're running as the cookbook user
echo "Running database migrations..."
npm run db:migrate

echo "Starting application..."
exec node .output/server/index.mjs
