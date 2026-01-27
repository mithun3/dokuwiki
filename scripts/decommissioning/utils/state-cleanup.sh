#!/bin/bash

# UTILITY: Terraform State Cleanup
# Archives and cleans up Terraform state files

set -euo pipefail

TERRAFORM_DIR="${TERRAFORM_DIR:-/Users/mithunselvan/dokuwiki/infra}"
LOG_FILE="${LOG_FILE:-./logs/state-cleanup.log}"

echo "🗂️  TERRAFORM STATE CLEANUP"
echo "======================================"
echo "Terraform Directory: $TERRAFORM_DIR"
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

# Check directory
if [[ ! -d "$TERRAFORM_DIR" ]]; then
    echo "❌ Terraform directory not found: $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

log "Starting Terraform state cleanup..."

# 1. Create archive directory
ARCHIVE_DIR=".archive"
ARCHIVE_DATE=$(date +%Y%m%d-%H%M%S)

log "1. Creating archive directory..."
mkdir -p "$ARCHIVE_DIR"

# 2. Backup state files
log "2. Backing up state files..."
if [[ -f "terraform.tfstate" ]]; then
    cp terraform.tfstate "$ARCHIVE_DIR/terraform.tfstate-$ARCHIVE_DATE"
    log "   ✓ Archived: terraform.tfstate"
fi

if [[ -f "terraform.tfstate.backup" ]]; then
    cp terraform.tfstate.backup "$ARCHIVE_DIR/terraform.tfstate.backup-$ARCHIVE_DATE"
    log "   ✓ Archived: terraform.tfstate.backup"
fi

# 3. Backup lock file
if [[ -f ".terraform.lock.hcl" ]]; then
    cp .terraform.lock.hcl "$ARCHIVE_DIR/.terraform.lock.hcl-$ARCHIVE_DATE"
    log "   ✓ Archived: .terraform.lock.hcl"
fi

# 4. Clean working directory
log "3. Cleaning Terraform working directory..."
rm -rf .terraform
rm -f terraform.tfstate*
rm -f .terraform.lock.hcl
log "   ✓ Cleaned .terraform directory"
log "   ✓ Removed state files"

# 5. Create cleanup manifest
log "4. Creating cleanup manifest..."
cat > "$ARCHIVE_DIR/CLEANUP-MANIFEST-$ARCHIVE_DATE.txt" << EOF
Terraform State Cleanup
Date: $(date)
Directory: $TERRAFORM_DIR

Files Archived:
EOF

ls -la "$ARCHIVE_DIR" | grep $ARCHIVE_DATE >> "$ARCHIVE_DIR/CLEANUP-MANIFEST-$ARCHIVE_DATE.txt" || true

log ""
log "✅ Terraform state cleanup complete"
log "   Archived to: $ARCHIVE_DIR/"
echo ""
echo "Archive Contents:"
ls -la "$ARCHIVE_DIR/" | grep $ARCHIVE_DATE
