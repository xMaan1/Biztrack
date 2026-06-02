#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ensure-uv.sh
source "${SCRIPT_DIR}/ensure-uv.sh"

BACKEND_DIR="${1:-$(cd "${SCRIPT_DIR}/../backend" && pwd)}"

cd "${BACKEND_DIR}"

echo "Syncing backend dependencies (frozen lockfile)..."
uv sync --frozen --no-dev

echo "Backend ready at ${BACKEND_DIR}/.venv"
