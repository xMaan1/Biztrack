#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# shellcheck source=ensure-uv.sh
source "${SCRIPT_DIR}/ensure-uv.sh"

echo "Starting deployment..."

echo "Setting up backend..."
"${SCRIPT_DIR}/deploy-backend-uv.sh" "${PROJECT_ROOT}/backend"

echo "Setting up frontend..."
cd frontend

echo "Installing frontend dependencies..."
npm ci

echo "Building frontend..."
npm run build

cd ..

echo "Setting up LMS backend..."
cd lms-platform/backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt
cd "$PROJECT_ROOT"

echo "Building LMS frontend..."
cd lms-platform/frontend
npm ci
# Public API base for the LMS. Override with LMS_API_URL to point at a
# dedicated public backend; defaults to the same origin under /lms-api.
NEXT_PUBLIC_API_URL="${LMS_API_URL:-${PUBLIC_BASE_URL:-http://localhost:8001}/lms-api}" npm run build
cd "$PROJECT_ROOT"

echo "Restarting PM2 processes..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "Saving PM2 configuration..."
pm2 save

echo "Deployment completed successfully!"
echo ""
echo "PM2 Status:"
pm2 status
