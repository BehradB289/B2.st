# ==============================================================================
# B2.st Studio - Production Dockerfile for Modular Super Mario Web Engine
# Multi-stage build: Stage 1 (Verification & Unit Testing) -> Stage 2 (Hardened Nginx)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Validation & Automated Testing
# ------------------------------------------------------------------------------
FROM node:20-alpine AS test-runner

WORKDIR /workspace

# کپی پیکربندی وابستگی‌ها
COPY package*.json ./

# نصب وابستگی‌های توسعه و تست
RUN npm ci --prefer-offline --no-audit

# کپی سورس کد، فایل‌های عمومی و تست‌ها
COPY public/ ./public/
COPY src/ ./src/
COPY tests/ ./tests/

# اجرای پایپ‌لاین تست‌های فیزیک، برخوردها و گرانش قبل از صدور آرتیفکت نهایی
RUN npm test

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Runtime
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine-slim AS production

LABEL maintainer="B2.st Studio DevOps Team <devops@b2.st>"
LABEL project="Super Mario NES HTML5/ES6 Engine"
LABEL architecture="Modular ECS Canvas 2D"

# حذف پیکربندی پیش‌فرض انجین‌ایکس
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# تنظیم مجوزهای امنیتی و کاربر غیر ریشه (Non-root)
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# کپی فایل کانفیگ اختصاصی وب‌سرور
COPY config/nginx.conf /etc/nginx/nginx.conf

# کپی کدهای تایید شده پروژه به روت سرور
# public در ریشه و src برای ماژول‌های ES6
COPY --chown=nginx:nginx public/ /usr/share/nginx/html/
COPY --chown=nginx:nginx src/ /usr/share/nginx/html/src/

# تعیین کاربر امن جهت اجرای کانتینر
USER nginx

# اکسپوز پورت داخلی HTTP
EXPOSE 8080

# بررسی سلامت کانتینر با wget داخلی Alpine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]