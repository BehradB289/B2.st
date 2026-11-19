#!/usr/bin/env bash
# ==============================================================================
# B2.st Studio - Mario Game Engine Probe Script
# Used by external orchestrators and monitoring agents
# ==============================================================================

set -euo pipefail

TARGET_HOST="${1:-127.0.0.1}"
TARGET_PORT="${2:-8080}"
HEALTH_URL="http://${TARGET_HOST}:${TARGET_PORT}/healthz"

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$STATUS_CODE" -eq 200 ]; then
    echo "OK: Mario Engine service is healthy ($STATUS_CODE)."
    exit 0
else
    echo "CRITICAL: Mario Engine service returned HTTP $STATUS_CODE from $HEALTH_URL."
    exit 1
fi