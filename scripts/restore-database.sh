#!/bin/bash

###############################################################################
# Database Restore Script
# Restores PostgreSQL database from backup
###############################################################################

set -e

# Configuration
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-chat_studio}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check arguments
if [ $# -eq 0 ]; then
    error "Usage: $0 <backup-file.sql.gz>"
    error "Example: $0 ./backups/database/backup_chat_studio_20240121_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# Validate backup file
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    error "Invalid or corrupted backup file"
    exit 1
fi

log "=========================================="
log "Database Restore Script"
log "=========================================="
log "Backup file: $BACKUP_FILE"
log "Database: $POSTGRES_DB"
log "Host: $POSTGRES_HOST:$POSTGRES_PORT"
log "=========================================="

# Confirmation
read -p "This will REPLACE all data in $POSTGRES_DB. Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    warning "Restore cancelled by user"
    exit 0
fi

# Check database connectivity
log "Checking database connectivity..."
if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    error "Cannot connect to database"
    exit 1
fi

# Create backup of current database before restore
log "Creating safety backup of current database..."
SAFETY_BACKUP="./backups/database/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p ./backups/database

PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=plain \
    | gzip > "$SAFETY_BACKUP"

log "Safety backup created: $SAFETY_BACKUP"

# Drop and recreate database
log "Dropping existing database..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"

log "Creating new database..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;"

# Restore from backup
log "Restoring database from backup..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Verify restoration
log "Verifying restoration..."
TABLE_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    log "Restoration successful! Tables restored: $TABLE_COUNT"
    log "=========================================="
    log "Database Restore Completed"
    log "=========================================="
else
    error "Restoration may have failed - no tables found"
    error "Safety backup available at: $SAFETY_BACKUP"
    exit 1
fi
