#!/usr/bin/env python3

import os
import sys
import json
import subprocess
import hmac
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-webhook-secret-here')
WEBHOOK_PORT = int(os.getenv('WEBHOOK_PORT', '9000'))
PROJECT_ROOT = '/home/ubuntu/sparkco-erp'

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook':
            self.handle_webhook()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_webhook(self):
        content_length = int(self.headers.get('Content-Length', 0))
        payload = self.rfile.read(content_length)
        
        signature = self.headers.get('X-Hub-Signature-256', '')
        
        if not self.verify_signature(payload, signature):
            logger.warning("Invalid signature")
            self.send_response(401)
            self.end_headers()
            return

        try:
            data = json.loads(payload.decode('utf-8'))
            self.process_push(data)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            self.send_response(500)
            self.end_headers()

    def verify_signature(self, payload, signature):
        if not signature.startswith('sha256='):
            return False
        
        expected_signature = 'sha256=' + hmac.new(
            WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)

    def process_push(self, data):
        if data.get('ref') != 'refs/heads/main':
            logger.info("Ignoring non-main branch push")
            return

        commits = data.get('commits', [])
        if not commits:
            logger.info("No commits to process")
            return

        changed_files = set()
        for commit in commits:
            changed_files.update(commit.get('added', []))
            changed_files.update(commit.get('modified', []))
            changed_files.update(commit.get('removed', []))

        logger.info(f"Changed files: {changed_files}")

        frontend_changed = any(f.startswith('frontend/') for f in changed_files)
        backend_changed = any(f.startswith('backend/') for f in changed_files)

        if frontend_changed and backend_changed:
            logger.info("Both frontend and backend changed - deploying both")
            self.deploy_service('both')
        elif frontend_changed:
            logger.info("Frontend changed - deploying frontend")
            self.deploy_service('frontend')
        elif backend_changed:
            logger.info("Backend changed - deploying backend")
            self.deploy_service('backend')
        else:
            logger.info("No frontend or backend changes detected")

    def deploy_service(self, service):
        try:
            if service == 'frontend' or service == 'both':
                self.deploy_frontend()
            
            if service == 'backend' or service == 'both':
                self.deploy_backend()
                
        except Exception as e:
            logger.error(f"Deployment failed: {e}")

    def deploy_frontend(self):
        logger.info("Starting frontend deployment...")
        
        os.chdir(PROJECT_ROOT)
        
        subprocess.run(['git', 'pull', 'origin', 'main'], check=True)
        
        os.chdir('frontend')
        
        subprocess.run(['npm', 'ci'], check=True)
        subprocess.run(['npm', 'run', 'build'], check=True)
        
        subprocess.run(['pm2', 'restart', 'frontend'], check=True)
        
        logger.info("Frontend deployment completed successfully")

    def deploy_backend(self):
        logger.info("Starting backend deployment...")
        
        os.chdir(PROJECT_ROOT)
        
        subprocess.run(['git', 'pull', 'origin', 'main'], check=True)
        
        os.chdir('backend')
        
        subprocess.run(['source', 'venv/bin/activate', '&&', 'pip', 'install', '-r', 'requirements.txt'], 
                      shell=True, check=True)
        
        subprocess.run(['pm2', 'restart', 'backend'], check=True)
        
        logger.info("Backend deployment completed successfully")

    def log_message(self, format, *args):
        logger.info(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', WEBHOOK_PORT), WebhookHandler)
    logger.info(f"Webhook server starting on port {WEBHOOK_PORT}")
    server.serve_forever()
