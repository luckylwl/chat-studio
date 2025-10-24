#!/bin/bash

###############################################################################
# Scheduled Backup Script
# Runs all backup tasks (database + files) and manages retention
###############################################################################

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
LOG_DIR="./logs/backups"
LOG_FILE="$LOG_DIR/backup_$(date +%Y%m%d).log"

# Create log directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Scheduled Backup Started"
log "=========================================="

# Run database backup
log "Running database backup..."
if bash "$SCRIPT_DIR/backup-database.sh" >> "$LOG_FILE" 2>&1; then
    log "Database backup completed successfully"
else
    log "Database backup failed"
    exit 1
fi

# Run file backup
log "Running file backup..."
if bash "$SCRIPT_DIR/backup-files.sh" >> "$LOG_FILE" 2>&1; then
    log "File backup completed successfully"
else
    log "File backup failed"
    exit 1
fi

# Generate summary
log "=========================================="
log "Backup Summary"
log "=========================================="
log "Database backups: $(find ./backups/database -name 'backup_*.sql.gz' | wc -l)"
log "File backups: $(find ./backups/files -name 'backup_*.tar.gz' | wc -l)"
log "Total backup size: $(du -sh ./backups | cut -f1)"
log "=========================================="
log "Scheduled Backup Completed Successfully"
log "=========================================="

# Clean old logs (keep 90 days)
find "$LOG_DIR" -name "backup_*.log" -mtime +90 -delete
