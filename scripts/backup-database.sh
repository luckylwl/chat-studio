#!/bin/bash

###############################################################################
# Database Backup Script
# Automatically backs up PostgreSQL database with rotation
###############################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-chat_studio}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# S3 Configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
AWS_PROFILE="${AWS_PROFILE:-default}"

# Notification Configuration
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Send notification
send_notification() {
    local message=$1
    local status=$2

    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$message\",\"status\":\"$status\"}" \
            --silent --show-error || warning "Failed to send notification"
    fi
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Check if database is accessible
check_database() {
    log "Checking database connectivity..."

    if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" > /dev/null 2>&1; then
        error "Cannot connect to database"
        send_notification "Database backup failed: Cannot connect to database" "error"
        exit 1
    fi

    log "Database is accessible"
}

# Create backup
create_backup() {
    log "Starting database backup..."
    log "Database: $POSTGRES_DB"
    log "Backup file: $BACKUP_FILE"

    # Create backup with pg_dump
    if PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        | gzip > "$BACKUP_FILE"; then

        local size=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup created successfully: $BACKUP_FILE ($size)"
        send_notification "Database backup successful: $BACKUP_FILE ($size)" "success"
        return 0
    else
        error "Backup failed"
        send_notification "Database backup failed" "error"
        return 1
    fi
}

# Verify backup
verify_backup() {
    log "Verifying backup integrity..."

    if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "Backup file is valid"
        return 0
    else
        error "Backup file is corrupted"
        send_notification "Backup verification failed: File is corrupted" "error"
        return 1
    fi
}

# Upload to S3 (optional)
upload_to_s3() {
    if [ -n "$S3_BUCKET" ]; then
        log "Uploading backup to S3..."

        local s3_path="s3://$S3_BUCKET/database/$(basename $BACKUP_FILE)"

        if aws s3 cp "$BACKUP_FILE" "$s3_path" --profile "$AWS_PROFILE" --storage-class STANDARD_IA; then
            log "Backup uploaded to S3: $s3_path"
            send_notification "Backup uploaded to S3: $s3_path" "success"
        else
            warning "Failed to upload backup to S3"
            send_notification "Failed to upload backup to S3" "warning"
        fi
    fi
}

# Clean old backups
clean_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

    local deleted_count=0

    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename $file)"
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)

    if [ $deleted_count -gt 0 ]; then
        log "Deleted $deleted_count old backup(s)"
    else
        log "No old backups to delete"
    fi

    # Clean S3 old backups (optional)
    if [ -n "$S3_BUCKET" ]; then
        log "Cleaning up old S3 backups..."

        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

        aws s3 ls "s3://$S3_BUCKET/database/" --profile "$AWS_PROFILE" | while read -r line; do
            local file_date=$(echo "$line" | awk '{print $4}' | grep -oP '\d{8}' | head -1)
            local file_name=$(echo "$line" | awk '{print $4}')

            if [ -n "$file_date" ] && [ "$file_date" -lt "$cutoff_date" ]; then
                aws s3 rm "s3://$S3_BUCKET/database/$file_name" --profile "$AWS_PROFILE"
                log "Deleted old S3 backup: $file_name"
            fi
        done
    fi
}

# Generate backup report
generate_report() {
    local report_file="$BACKUP_DIR/backup_report_$TIMESTAMP.txt"

    cat > "$report_file" << EOF
Database Backup Report
=====================
Date: $(date)
Database: $POSTGRES_DB
Host: $POSTGRES_HOST:$POSTGRES_PORT
Backup File: $BACKUP_FILE
File Size: $(du -h "$BACKUP_FILE" | cut -f1)
Retention: $RETENTION_DAYS days

Backup Status: SUCCESS
EOF

    log "Report generated: $report_file"
}

# Main execution
main() {
    log "=========================================="
    log "Database Backup Script Started"
    log "=========================================="

    create_backup_dir
    check_database

    if create_backup && verify_backup; then
        upload_to_s3
        clean_old_backups
        generate_report

        log "=========================================="
        log "Database Backup Completed Successfully"
        log "=========================================="
        exit 0
    else
        error "=========================================="
        error "Database Backup Failed"
        error "=========================================="
        exit 1
    fi
}

# Run main function
main "$@"
