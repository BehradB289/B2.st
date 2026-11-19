#!/usr/bin/env bash
# ==============================================================================
# B2.st Studio - Automated Deployment Script
# Zero-Downtime Deployment & Health Verification Pipeline
# ==============================================================================

set -euo pipefail

# رنگ‌ها جهت نمایش وضعیت خروجی در ترمینال
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PORT="${PORT:-8080}"
COMPOSE_FILE="docker-compose.yml"
CONTAINER_NAME="b2st_mario_web"
HEALTHCHECK_URL="http://127.0.0.1:${PORT}/healthz"
MAX_ATTEMPTS=20
WAIT_SECONDS=2

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}       B2.st Studio Deployment Pipeline: MARIO       ${NC}"
echo -e "${CYAN}====================================================${NC}"

# ۱. اعتبارسنجی ابزارهای مورد نیاز
command -v docker >/dev/null 2>&1 || { 
    echo -e "${RED}[ERROR] Docker نصب نیست یا در PATH موجود نمی‌باشد.${NC}" >&2; exit 1; 
}

# ۲. اجرای آزمون‌های واحد و صحت‌سنجی فیزیک و گرانش به صورت لوکال (در صورت وجود نود)
if command -v npm >/dev/null 2>&1; then
    echo -e "${YELLOW}[1/4] Running pre-flight automated test suite...${NC}"
    npm test || {
        echo -e "${RED}[ERROR] Unit tests failed! Aborting deployment.${NC}" >&2
        exit 1
    }
    echo -e "${GREEN}[✔] Pre-flight tests passed successfully.${NC}"
else
    echo -e "${YELLOW}[1/4] Node.js not detected on host. Test stage will run inside Docker multi-stage build.${NC}"
fi

# ۳. بیلد ایمیج پروداکشن
echo -e "${YELLOW}[2/4] Building production Docker image...${NC}"
docker compose -f "${COMPOSE_FILE}" build --pull

# ۴. راه‌اندازی کانتینر با پیکربندی جدید
echo -e "${YELLOW}[3/4] Starting service containers...${NC}"
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

# ۵. بازرسی سلامت (Smoke Test & Healthcheck Verification)
echo -e "${YELLOW}[4/4] Verifying endpoint availability at ${HEALTHCHECK_URL}...${NC}"

attempt=1
success=0

while [ $attempt -le $MAX_ATTEMPTS ]; do
    if curl -s -f -o /dev/null "${HEALTHCHECK_URL}"; then
        success=1
        break
    fi
    echo -e "Attempt ${attempt}/${MAX_ATTEMPTS}: Service not ready yet. Retrying in ${WAIT_SECONDS}s..."
    sleep $WAIT_SECONDS
    attempt=$((attempt + 1))
done

if [ $success -eq 1 ]; then
    echo -e "${GREEN}====================================================${NC}"
    echo -e "${GREEN}[✔] Deployment SUCCESSFUL!${NC}"
    echo -e "${GREEN}Engine is running live on: http://localhost:${PORT}${NC}"
    echo -e "${GREEN}Container: ${CONTAINER_NAME}${NC}"
    echo -e "${GREEN}====================================================${NC}"
    exit 0
else
    echo -e "${RED}====================================================${NC}"
    echo -e "${RED}[✖] Deployment FAILED! Healthcheck timed out.${NC}"
    echo -e "${RED}Displaying last 30 container log entries:${NC}"
    docker logs --tail 30 "${CONTAINER_NAME}" || true
    echo -e "${RED}====================================================${NC}"
    exit 1
fi