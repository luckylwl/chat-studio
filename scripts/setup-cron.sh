#!/bin/bash

###############################################################################
# Setup Cron Jobs for Automated Backups
###############################################################################

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Setting up automated backup cron jobs..."

# Create cron job entry
CRON_JOB="0 2 * * * cd $PROJECT_ROOT && bash $SCRIPT_DIR/scheduled-backup.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scheduled-backup.sh"; then
    warning "Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    log "Cron job added successfully"
fi

log "Backup schedule: Daily at 2:00 AM"
log "To view cron jobs: crontab -l"
log "To remove: crontab -e"

# Display current cron jobs
echo ""
log "Current cron jobs:"
crontab -l
