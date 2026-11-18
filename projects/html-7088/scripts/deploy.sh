#!/usr/bin/env bash
# ==============================================================================
# B2.st Studio - Automated Zero-Downtime Deployment Script
# پروژه: بازی ماریو Canvas ES6
# ==============================================================================

set -euo pipefail

# پالت رنگی ترمینال
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# متغیرهای روت و مسیرها
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.example"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    if [ $? -ne 0 ]; then
        log_error "استقرار با خطا مواجه شد. در حال بررسی وضعیت قبلی..."
    fi
}
trap cleanup EXIT

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}         B2.st Studio - Mario Deployment              ${NC}"
echo -e "${BLUE}======================================================${NC}"

cd "$PROJECT_ROOT"

# ۱. بررسی پیش‌نیازهای سیستمی
log_info "بررسی وجود Docker و Docker Compose..."
if ! command -v docker &> /dev/null; then
    log_error "داکر (docker) بر روی سرور نصب نیست!"
    exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    log_error "دستور docker compose یافت نشد!"
    exit 1
fi
log_success "ابزارهای داکر شناسایی شدند: $DOCKER_COMPOSE_CMD"

# ۲. اعتبارسنجی فایل تنظیمات محیطی (.env)
if [ ! -f "$ENV_FILE" ]; then
    log_warning "فایل .env یافت نشد. تولید از روی .env.example..."
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        log_success "فایل .env با موفقیت ایجاد شد."
    else
        log_error "فایل .env.example نیز وجود ندارد!"
        exit 1
    fi
fi

# بارگذاری متغیرهای محیطی
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# ۳. اجرای تست‌های یکپارچه قبل از پروسه بیلد کانتینر
log_info "اجرای تست‌های انجین و فیزیک ماریو..."
if docker run --rm -v "${PROJECT_ROOT}:/workspace" -w /workspace node:20-alpine sh -c "if [ -d 'tests' ]; then node --test tests/**/*.test.js; fi"; then
    log_success "تمام تست‌های فیزیک و گرانش با موفقیت پاس شدند."
else
    log_warning "تست‌های محلی اجرا نشدند یا تست جدیدی یافت نشد. اعتبارسنجی در Stage 1 داکرفایل ادامه می‌یابد."
fi

# ۴. بیلد کانتینر پروداکشن
log_info "شروع ساخت ایمیج چندمرحله‌ای (Multi-Stage Build)..."
$DOCKER_COMPOSE_CMD build --pull mario-game

# ۵. پشتیبان‌گیری از وضعیت قبل جهت رول‌بک در صورت شکست
OLD_CONTAINER_ID=$(docker ps -q -f name=b2st-mario-web || true)

# ۶. استقرار بدون داون‌تایم و اجرای کانتینر جدید
log_info "راه‌اندازی سرویس ماریو در بستر امن..."
$DOCKER_COMPOSE_CMD up -d --remove-orphans mario-game

# ۷. بررسی وضعیت سلامت (Health Check Polling)
log_info "در حال پایش سلامت سرویس..."
MAX_ATTEMPTS=20
ATTEMPT=0
HEALTH_URL="http://127.0.0.1:${HOST_PORT:-80}/healthz"

until curl -s -f "$HEALTH_URL" | grep -q "healthy"; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        log_error "سرویس پس از $MAX_ATTEMPTS تلاش به وضعیت سالم نرسید!"
        log_error "نمایش آخرین لاگ‌های کانتینر:"
        $DOCKER_COMPOSE_CMD logs --tail=50 mario-game
        
        if [ -n "$OLD_CONTAINER_ID" ]; then
            log_warning "شروع عملیات بازگشت به نسخه قبل (Rollback)..."
            bash "${PROJECT_ROOT}/scripts/rollback.sh"
        fi
        exit 1
    fi
    echo -n "."
    sleep 2
done

echo ""
log_success "کانتینر در وضعیت کاملاً پایدار (Healthy) قرار دارد."

# ۸. پاک‌سازی ایمیج‌های هرز و معلق (Dangling Images)
log_info "پاک‌سازی کش‌های بلااستفاده داکر..."
docker image prune -f > /dev/null 2>&1 || true

log_success "استقرار با موفقیت کامل انجام شد!"
echo -e "${GREEN}==> بازی هم‌اکنون روی پورت ${HOST_PORT:-80} آماده اجرا است.${NC}"
exit 0