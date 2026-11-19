#!/usr/bin/env bash
# ==============================================================================
# B2.st Studio - Automated Deployment Script
# Project: Mario HTML5 Canvas Engine
# ==============================================================================

set -euo pipefail

# Visual formatting
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_RESET='\033[0m'

log_info() {
    printf "${COLOR_CYAN}[B2.st INFO]${COLOR_RESET} %s\n" "$1"
}

log_success() {
    printf "${COLOR_GREEN}[B2.st SUCCESS]${COLOR_RESET} %s\n" "$1"
}

log_warn() {
    printf "${COLOR_YELLOW}[B2.st WARN]${COLOR_RESET} %s\n" "$1"
}

log_error() {
    printf "${COLOR_RED}[B2.st ERROR]${COLOR_RESET} %s\n" "$1"
}

banner() {
    cat << "EOF"
  ____ ___       _     __  __            _       
 | __ )___ \ ___| |_  |  \/  | __ _ _ __(_) ___  
 |  _ \ __) / __| __| | |\/| |/ _` | '__| |/ _ \ 
 | |_) / __/\__ \ |_  | |  | | (_| | |  | | (_) |
 |____/_____|___/\__| |_|  |_|\__,_|_|  |_|\___/ 
          ENGINE DEPLOYMENT PIPELINE
EOF
}

banner

# Step 1: Root directory navigation
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"
log_info "Working directory: $ROOT_DIR"

# Step 2: Prerequisites validation
log_info "Verifying container orchestration tools..."
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker engine is not installed or not in PATH."
    exit 1
fi

COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    log_error "Docker Compose is required but not found."
    exit 1
fi
log_info "Using compose driver: $COMPOSE_CMD"

# Step 3: Environment Setup
if [ ! -f .env ]; then
    if [ -f config/.env.example ]; then
        log_warn "No .env found. Initializing from config/.env.example..."
        cp config/.env.example .env
    else
        touch .env
    fi
fi

# Load variables
export $(grep -v '^#' .env | xargs -r) 2>/dev/null || true
TARGET_PORT="${PORT:-8080}"

# Step 4: Building container image
log_info "Building production Docker image for Mario Web Engine..."
$COMPOSE_CMD build --pull mario-game

# Step 5: Rolling launch
log_info "Launching service on port $TARGET_PORT..."
$COMPOSE_CMD up -d --remove-orphans mario-game

# Step 6: Health verification loop
log_info "Running health probe verification on http://127.0.0.1:${TARGET_PORT}/healthz..."
MAX_ATTEMPTS=20
ATTEMPT=1
HEALTHY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -s -f "http://127.0.0.1:${TARGET_PORT}/healthz" >/dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    printf "."
    sleep 1
    ATTEMPT=$((ATTEMPT + 1))
done
printf "\n"

if [ "$HEALTHY" = true ]; then
    log_success "Deployment completed successfully! Game is running at: http://127.0.0.1:${TARGET_PORT}"
else
    log_error "Health check failed after ${MAX_ATTEMPTS} attempts. Inspecting container logs:"
    $COMPOSE_CMD logs --tail=40 mario-game
    exit 1
fi

# Step 7: Clean legacy images
log_info "Purging dangling Docker layers..."
docker image prune -f >/dev/null 2>&1 || true

log_success "All deployment steps executed cleanly."