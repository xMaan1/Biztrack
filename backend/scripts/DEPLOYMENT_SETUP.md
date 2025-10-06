# Auto-Deployment Setup Guide

## Overview
This setup provides automatic deployment for your BizTrack application using GitHub webhooks. When you push changes to your repository, it will automatically detect which services need to be updated and deploy only those services.

## Features
- ✅ Automatic change detection (frontend, backend, or both)
- ✅ PM2 integration for service management
- ✅ Secure webhook verification
- ✅ Comprehensive logging
- ✅ Rollback capability

## Setup Instructions

### 1. Upload Files to EC2
```bash
# Copy the deployment files to your EC2 server
scp -i "sparkco-erp2.pem" backend/scripts/webhook_server.py ubuntu@ec2-34-229-90-27.compute-1.amazonaws.com:/home/ubuntu/sparkco-erp/backend/scripts/
scp -i "sparkco-erp2.pem" backend/scripts/deploy.sh ubuntu@ec2-34-229-90-27.compute-1.amazonaws.com:/home/ubuntu/sparkco-erp/backend/scripts/
scp -i "sparkco-erp2.pem" backend/scripts/setup_webhook.sh ubuntu@ec2-34-229-90-27.compute-1.amazonaws.com:/home/ubuntu/sparkco-erp/backend/scripts/
```

### 2. Run Setup Script on EC2
```bash
ssh -i "sparkco-erp2.pem" ubuntu@ec2-34-229-90-27.compute-1.amazonaws.com
cd /home/ubuntu/sparkco-erp/backend/scripts
chmod +x setup_webhook.sh
./setup_webhook.sh
```

### 3. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to Settings → Webhooks
3. Click "Add webhook"
4. Configure:
   - **Payload URL**: `http://ec2-34-229-90-27.compute-1.amazonaws.com:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: Use the secret from webhook.env (or generate a new one)
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked

### 4. Test Deployment
```bash
# Make a small change to frontend
echo "// Test change" >> frontend/src/app/page.tsx
git add .
git commit -m "Test frontend deployment"
git push origin main

# Check logs
pm2 logs webhook-server
pm2 logs frontend
pm2 logs backend
```

## Manual Deployment Commands

If you need to deploy manually:

```bash
# Deploy only frontend
./deploy.sh frontend

# Deploy only backend  
./deploy.sh backend

# Deploy both
./deploy.sh both
```

## Monitoring

### View Deployment Logs
```bash
# Webhook server logs
pm2 logs webhook-server

# Application logs
pm2 logs frontend
pm2 logs backend

# Deployment logs
tail -f /home/ubuntu/deploy.log
```

### Check Service Status
```bash
pm2 list
pm2 status
```

## Security Notes

1. **Change Webhook Secret**: Update the secret in `webhook.env` with a strong random string
2. **Firewall**: The setup script configures UFW to allow webhook port (9000)
3. **HTTPS**: Consider using a reverse proxy (nginx) with SSL for production

## Troubleshooting

### Webhook Not Triggering
1. Check GitHub webhook delivery logs
2. Verify webhook server is running: `pm2 list`
3. Check firewall: `sudo ufw status`
4. Test webhook manually: `curl -X POST http://localhost:9000/webhook`

### Deployment Fails
1. Check deployment logs: `tail -f /home/ubuntu/deploy.log`
2. Verify git permissions
3. Check PM2 service status: `pm2 list`
4. Restart services manually: `pm2 restart frontend` or `pm2 restart backend`

### Service Won't Start
1. Check application logs: `pm2 logs frontend` or `pm2 logs backend`
2. Verify dependencies are installed
3. Check environment variables
4. Restart PM2: `pm2 restart all`
