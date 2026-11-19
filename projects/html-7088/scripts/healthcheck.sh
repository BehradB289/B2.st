#!/usr/bin/env bash
# ==============================================================================
# B2.st Studio - Standalone Runtime Health Probe
# ==============================================================================

set -euo pipefail

TARGET_HOST="${1:-127.0.0.1}"
TARGET_PORT="${2:-8080}"
ENDPOINT="http://${TARGET_HOST}:${TARGET_PORT}/healthz"

response=$(curl -s -w "\n%{http_code}" "${ENDPOINT}" || echo "FAILED")

status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 200 ]; then
    echo "[HEALTHY] Mario engine HTTP 200 OK - Response: ${body}"
    exit 0
else
    echo "[UNHEALTHY] Mario engine probe failed with status: ${status_code}"
    exit 1
fi