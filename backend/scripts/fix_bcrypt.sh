#!/bin/bash

set -e

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

fix_bcrypt_issue() {
    log "Fixing bcrypt installation and configuration..."
    
    cd /home/ubuntu/Biztrack/backend
    
    # Activate virtual environment
    source venv/bin/activate
    
    log "Uninstalling existing bcrypt and passlib..."
    pip uninstall -y bcrypt passlib || true
    
    log "Installing system dependencies for bcrypt..."
    sudo apt-get update
    sudo apt-get install -y build-essential libffi-dev python3-dev
    
    log "Installing bcrypt and passlib with proper versions..."
    pip install bcrypt==4.3.0
    pip install "passlib[bcrypt]==1.7.4"
    
    log "Verifying bcrypt installation..."
    python -c "
import bcrypt
import passlib.context
print('bcrypt version:', bcrypt.__version__)
print('passlib version:', passlib.__version__)
pwd_context = passlib.context.CryptContext(schemes=['bcrypt'], deprecated='auto')
test_hash = pwd_context.hash('test123')
print('Test hash created successfully:', test_hash[:20] + '...')
print('Test verification:', pwd_context.verify('test123', test_hash))
"
    
    log "Restarting backend service..."
    pm2 restart backend || pm2 start backend
    
    log "bcrypt fix completed!"
}

main() {
    log "Starting bcrypt fix process..."
    fix_bcrypt_issue
    log "bcrypt fix process completed successfully!"
}

main "$@"