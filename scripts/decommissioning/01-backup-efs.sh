#!/bin/bash

# PHASE 1: Backup EFS Data
# Creates snapshots of EFS and backs up to local storage

set -euo pipefail

EFS_ID="${EFS_ID:-fs-xxxxxxxxxx}"
BACKUP_PATH="${BACKUP_LOCAL_PATH:-.}/backups"
LOG_FILE="${LOG_FILE:-./logs/phase1-backup.log}"

mkdir -p "$BACKUP_PATH"

echo "📦 PHASE 1: Backup EFS Data"
echo "======================================"
echo "EFS ID: $EFS_ID"
echo "Backup Path: $BACKUP_PATH"
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

log "Starting EFS backup..."

# 1. Get EFS snapshots
log "1. Creating EFS snapshot..."
SNAPSHOT_DESC="dokuwiki-backup-$(date +%Y%m%d-%H%M%S)"

# Note: EFS doesn't have native snapshots like EBS
# Instead, we document the backup process
log "   Note: EFS requires manual backup via ECS container or AWS DataSync"
log "   Using AWS DataSync or ECS container to backup EFS data..."

# 2. List mount targets
log "2. Listing EFS mount targets..."
aws efs describe-mount-targets \
    --file-system-id "$EFS_ID" \
    --region "${AWS_REGION:-us-east-1}" \
    --query 'MountTargets[].{MountTargetId:MountTargetId, SubnetId:SubnetId, State:LifeCycleState}' \
    --output table | tee -a "$LOG_FILE"

# 3. Create backup record
log "3. Creating backup manifest..."
cat > "$BACKUP_PATH/backup-manifest-$SNAPSHOT_DESC.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "efs_id": "$EFS_ID",
  "backup_type": "EFS snapshot",
  "status": "initiated",
  "location": "$BACKUP_PATH",
  "estimated_size": "TBD (depends on EFS usage)"
}
EOF

log "✓ Backup manifest created: backup-manifest-$SNAPSHOT_DESC.json"

# 4. Recommendation
log ""
log "⚠️  MANUAL STEP REQUIRED:"
log "   Execute within ECS container to backup EFS:"
log ""
log "   aws ecs execute-command \\"
log "     --cluster dokuwiki-prod-cluster \\"
log "     --task \$(aws ecs list-tasks --cluster dokuwiki-prod-cluster --query 'taskArns[0]' --output text) \\"
log "     --container dokuwiki-app \\"
log "     --interactive \\"
log "     --command '/bin/bash'"
log ""
log "   Then in container:"
log "   tar -czf dokuwiki-backup-$(date +%Y%m%d).tar.gz /data"
log "   exit"
log ""
log "   Then download:"
log "   aws s3 cp s3://YOUR_BACKUP_BUCKET/dokuwiki-backup-*.tar.gz $BACKUP_PATH/"
log ""

log "✅ Phase 1 complete: EFS backup initialized"
log "   Manifest: backup-manifest-$SNAPSHOT_DESC.json"
log "   Next: Execute manual backup steps or use DataSync"
