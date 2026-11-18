```dockerfile
# ═══════════════════════════════════════
# LinkBox — Production Dockerfile
# ═══════════════════════════════════════

FROM node:20-alpine AS base

# Install build tools for better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Remove build tools after native addon is compiled
RUN apk del python3 make g++

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Run migrations
RUN node src/db/migrate.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "src/server.js"]
```