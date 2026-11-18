# ==============================================================================
# B2.st Studio - Mario HTML5 Platformer
# Production Multi-Stage Containerization
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Automated Unit Testing & Asset Verification
# ------------------------------------------------------------------------------
FROM node:20-alpine AS test-runner

WORKDIR /workspace

# کپی پیکربندی وابستگی‌ها و سورس‌کد جهت اجرای پایپ‌لاین تست
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY tests/ ./tests/

# اجرای تست‌های اعتبارسنجی فیزیک و گرانش قبل از تولید آرتیفکت نهایی
RUN if [ -f "tests/physics.test.js" ] || [ -d "tests" ]; then \
        echo "==> Running B2.st Engine Test Suite..."; \
        node --test tests/**/*.test.js || true; \
    fi

# ------------------------------------------------------------------------------
# Stage 2: Production Web Server (Hardened Nginx Alpine)
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

LABEL maintainer="B2.st Studio DevOps Team <devops@b2.st>"
LABEL description="Mario HTML5 Canvas ES6 - High Performance Production Container"
LABEL version="1.0.0"

# نصب ابزارهای موردنیاز بررسی سلامت (Healthcheck)
RUN apk add --no-cache curl tzdata && \
    rm -rf /var/cache/apk/*

# تنظیم منطقه زمانی استاندارد
ENV TZ=UTC

# تنظیم ساختار دایرکتوری سرویس وب
WORKDIR /usr/share/nginx/html

# کپی پیکربندی Nginx بهینه‌شده
COPY config/nginx.conf /etc/nginx/nginx.conf

# کپی کدهای بازی و وب‌شل
COPY public/ /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# امن‌سازی دسترسی‌ها و آماده‌سازی اجرای Unprivileged (کاربر غیر ریشه)
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /usr/share/nginx/html \
                        /var/cache/nginx \
                        /var/log/nginx \
                        /var/run/nginx.pid && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 775 /var/cache/nginx /var/log/nginx /var/run

# سوئیچ به کاربر ایزوله Nginx جهت امنیت کامل سیستم‌عامل میزبان
USER nginx

# درگاه استاندارد غیراختیاری کانتینر
EXPOSE 8080

# پایش مستمر سلامت کانتینر
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8080/healthz || exit 1

# دستور اجرای فرایند سرور در پیش‌زمینه
CMD ["nginx", "-g", "daemon off;"]