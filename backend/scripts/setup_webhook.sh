#!/bin/bash

set -e

PROJECT_ROOT="/home/ubuntu/sparkco-erp"
WEBHOOK_PORT=9000
WEBHOOK_SECRET="your-webhook-secret-change-this"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

setup_webhook_server() {
    log "Setting up webhook server..."
    
    cd "$PROJECT_ROOT/backend/scripts"
    
    chmod +x webhook_server.py
    chmod +x deploy.sh
    
    log "Creating webhook server environment file..."
    cat > webhook.env << EOF
WEBHOOK_SECRET=$WEBHOOK_SECRET
WEBHOOK_PORT=$WEBHOOK_PORT
EOF
    
    log "Installing required Python packages..."
    pip install pycryptodome
    
    log "Creating PM2 ecosystem file for webhook server..."
    cat > webhook-ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'webhook-server',
    script: 'webhook_server.py',
    interpreter: 'python3',
    cwd: '$PROJECT_ROOT/backend/scripts',
    env_file: 'webhook.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: '/home/ubuntu/.pm2/logs/webhook-server.log',
    out_file: '/home/ubuntu/.pm2/logs/webhook-server-out.log',
    error_file: '/home/ubuntu/.pm2/logs/webhook-server-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    
    log "Starting webhook server with PM2..."
    pm2 start webhook-ecosystem.config.js
    
    log "Saving PM2 configuration..."
    pm2 save
    
    log "Setting up PM2 startup script..."
    pm2 startup
    
    log "Webhook server setup completed!"
    log "Webhook URL: http://$(curl -s ifconfig.me):$WEBHOOK_PORT/webhook"
    log "Webhook Secret: $WEBHOOK_SECRET"
}

setup_firewall() {
    log "Setting up firewall rules..."
    
    sudo ufw allow $WEBHOOK_PORT/tcp
    sudo ufw --force enable
    
    log "Firewall configured"
}

main() {
    log "Starting webhook server setup..."
    
    setup_webhook_server
    setup_firewall
    
    log "Setup completed successfully!"
    log "Next steps:"
    log "1. Update WEBHOOK_SECRET in webhook.env with a secure random string"
    log "2. Configure GitHub webhook with the URL and secret"
    log "3. Test the deployment by pushing changes to your repository"
}

main "$@"
