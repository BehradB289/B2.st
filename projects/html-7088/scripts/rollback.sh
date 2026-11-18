#!/usr/bin/env bash
# ==============================================================================
# B2.st Studio - Emergency Rollback Script
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${RED}[ROLLBACK] در حال بازگردانی کانتینر به آخرین نسخه پایدار...${NC}"

cd "$PROJECT_ROOT"

DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# متوقف‌سازی کانتینر ناپایدار
$DOCKER_COMPOSE_CMD stop mario-game || true

# راه‌اندازی نسخه قبلی موجود در رجیستری محلی
if docker image inspect b2st/mario-html5:latest &> /dev/null; then
    $DOCKER_COMPOSE_CMD up -d --no-build mario-game
    echo -e "${GREEN}[ROLLBACK] نسخه قبلی بازی مجدداً راه‌اندازی شد.${NC}"
else
    echo -e "${RED}[ROLLBACK FAILED] ایمیج پشتیبان یافت نشد!${NC}"
    exit 1
fi