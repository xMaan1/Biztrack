#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Starting deployment..."

echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing backend dependencies..."
pip install -r requirements.txt

cd ..

echo "Setting up frontend..."
cd frontend

echo "Installing frontend dependencies..."
npm ci

echo "Building frontend..."
npm run build

cd ..

echo "Restarting PM2 processes..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "Saving PM2 configuration..."
pm2 save

echo "Deployment completed successfully!"
echo ""
echo "PM2 Status:"
pm2 status

