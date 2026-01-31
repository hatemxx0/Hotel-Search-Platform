#!/bin/bash

# Production deployment script for Hotel Search Platform
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="hotel-search-platform"
APP_DIR="/var/www/hotel-search"
BACKUP_DIR="/var/backups/hotel-search"
LOG_FILE="/var/log/deploy-hotel-search.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

# Check if running as correct user
if [ "$USER" != "deploy" ] && [ "$USER" != "root" ]; then
    error "This script must be run as 'deploy' or 'root' user"
fi

log "Starting deployment of $APP_NAME to $ENVIRONMENT environment"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup current deployment
if [ -d "$APP_DIR" ]; then
    log "Creating backup of current deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    cp -r $APP_DIR $BACKUP_DIR/$BACKUP_NAME
    log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Navigate to app directory
cd $APP_DIR || error "Failed to navigate to $APP_DIR"

# Check if git repository exists
if [ ! -d ".git" ]; then
    error "Not a git repository. Please clone the repository first."
fi

# Stash any local changes
log "Stashing local changes..."
git stash

# Pull latest changes
log "Pulling latest changes from repository..."
git pull origin main || error "Failed to pull latest changes"

# Check if .env file exists
if [ ! -f ".env" ]; then
    warn ".env file not found. Please create it from .env.example"
    if [ -f ".env.example" ]; then
        log "Copying .env.example to .env..."
        cp .env.example .env
        warn "Please update .env with your actual API keys and configuration"
    fi
fi

# Install/update dependencies
log "Installing dependencies..."
npm ci --production || error "Failed to install dependencies"

# Build frontend
log "Building frontend..."
npm run build || error "Failed to build frontend"

# Run database migrations if they exist
if [ -d "migrations" ]; then
    log "Running database migrations..."
    npm run migrate || warn "Migration failed or no migrations to run"
fi

# Test the application
log "Running application tests..."
npm test || warn "Tests failed or no tests configured"

# Restart application with PM2
log "Restarting application..."
if pm2 list | grep -q "hotel-search-api"; then
    pm2 reload hotel-search-api || error "Failed to reload application"
else
    pm2 start ecosystem.config.js --env $ENVIRONMENT || error "Failed to start application"
fi

# Wait for application to start
log "Waiting for application to start..."
sleep 10

# Health check
log "Performing health check..."
HEALTH_URL="http://localhost:3001/health"
if curl -f -s $HEALTH_URL > /dev/null; then
    log "Health check passed"
else
    error "Health check failed. Application may not be running correctly."
fi

# Reload nginx configuration
log "Reloading nginx configuration..."
nginx -t || error "Nginx configuration test failed"
systemctl reload nginx || error "Failed to reload nginx"

# Clean up old backups (keep last 5)
log "Cleaning up old backups..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf

# Update file permissions
log "Updating file permissions..."
chown -R deploy:deploy $APP_DIR
chmod -R 755 $APP_DIR
chmod 600 $APP_DIR/.env

# Clear application cache if Redis is available
if command -v redis-cli &> /dev/null; then
    log "Clearing application cache..."
    redis-cli FLUSHALL || warn "Failed to clear Redis cache"
fi

# Log deployment completion
log "Deployment completed successfully!"
log "Application is running at: https://yourdomain.com"
log "API health check: $HEALTH_URL"

# Show PM2 status
log "Current PM2 status:"
pm2 status

# Show recent logs
log "Recent application logs:"
pm2 logs hotel-search-api --lines 10

log "Deployment script finished. Check the application at https://yourdomain.com"