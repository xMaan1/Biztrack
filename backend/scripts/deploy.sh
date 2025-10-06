#!/bin/bash

set -e

PROJECT_ROOT="/home/ubuntu/sparkco-erp"
LOG_FILE="/home/ubuntu/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

deploy_frontend() {
    log "Starting frontend deployment..."
    
    cd "$PROJECT_ROOT"
    git pull origin main
    
    cd frontend
    
    log "Installing frontend dependencies..."
    npm ci
    
    log "Building frontend..."
    npm run build
    
    log "Restarting frontend service..."
    pm2 restart frontend
    
    log "Frontend deployment completed successfully"
}

deploy_backend() {
    log "Starting backend deployment..."
    
    cd "$PROJECT_ROOT"
    git pull origin main
    
    cd backend
    
    log "Installing backend dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    
    log "Restarting backend service..."
    pm2 restart backend
    
    log "Backend deployment completed successfully"
}

deploy_both() {
    log "Starting full deployment..."
    deploy_frontend
    deploy_backend
    log "Full deployment completed successfully"
}

case "$1" in
    "frontend")
        deploy_frontend
        ;;
    "backend")
        deploy_backend
        ;;
    "both")
        deploy_both
        ;;
    *)
        echo "Usage: $0 {frontend|backend|both}"
        exit 1
        ;;
esac
