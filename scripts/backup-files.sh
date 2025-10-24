#!/bin/bash

###############################################################################
# File Backup Script
# Backs up application files, configurations, and user data
###############################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/files}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_files_${TIMESTAMP}.tar.gz"

# Directories to backup
BACKUP_SOURCES=(
    "./src"
    "./public"
    "./backend"
    "./docs"
    "./.env"
    "./package.json"
    "./package-lock.json"
    "./docker-compose.yml"
    "./nginx.conf"
)

# Exclude patterns
EXCLUDE_PATTERNS=(
    "node_modules"
    "*.pyc"
    "__pycache__"
    ".git"
    "dist"
    "build"
    "*.log"
    ".DS_Store"
    "coverage"
)

# S3 Configuration
S3_BUCKET="${S3_BUCKET:-}"
AWS_PROFILE="${AWS_PROFILE:-default}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Build exclude arguments
EXCLUDE_ARGS=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS+=(--exclude="$pattern")
done

# Create backup
log "Creating file backup..."
log "Backup file: $BACKUP_FILE"

if tar czf "$BACKUP_FILE" "${EXCLUDE_ARGS[@]}" "${BACKUP_SOURCES[@]}" 2>/dev/null; then
    size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: $size"
else
    error "Backup failed"
    exit 1
fi

# Upload to S3
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/files/" --profile "$AWS_PROFILE"
    log "Uploaded to S3"
fi

# Clean old backups
log "Cleaning old backups..."
find "$BACKUP_DIR" -name "backup_files_*.tar.gz" -mtime +$RETENTION_DAYS -delete
log "Cleanup completed"

log "File backup completed successfully"
