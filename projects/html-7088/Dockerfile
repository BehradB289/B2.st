# ==============================================================================
# B2.st Studio - Mario HTML5 Canvas Engine
# Multi-stage production container configuration
# ==============================================================================

FROM nginx:1.27-alpine

LABEL maintainer="B2.st Studio <dev@b2.st>"
LABEL project="mario-html5-canvas"
LABEL architecture="modular-canvas2d-ecs"
LABEL version="1.0.0"

# Install curl for container health checks
RUN apk add --no-cache curl

# Purge default configuration and default web assets
RUN rm -rf /etc/nginx/conf.d/* /etc/nginx/nginx.conf /usr/share/nginx/html/*

# Deploy optimized Nginx reverse proxy / static server configuration
COPY config/nginx.conf /etc/nginx/nginx.conf

# Deploy application assets (Web shell & ES6 Modular Source Code)
COPY public/ /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# Enforce secure least-privilege permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose standard HTTP port
EXPOSE 80

# Built-in health monitoring probe
HEALTHCHECK --interval=15s --timeout=4s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:80/healthz || exit 1

# Launch Nginx daemon in foreground
USER nginx
CMD ["nginx", "-g", "daemon off;"]