#!/bin/bash
#
# LMS backend launcher (Linux / production).
# Used by PM2 (ecosystem.config.js). Creates the venv on first run
# so the stack can start even on a fresh checkout.

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x "./venv/bin/python" ]; then
  echo "LMS backend venv not found - creating it..."
  python3 -m venv venv
  ./venv/bin/pip install --upgrade pip
  ./venv/bin/pip install -r requirements.txt
fi

exec ./venv/bin/python run.py
