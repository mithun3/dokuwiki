#!/bin/bash

# UTILITY: Emergency Rollback
# Restores infrastructure from backup in case of emergency

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
LOG_FILE="${LOG_FILE:-./logs/emergency-rollback.log}"

echo "🚨 EMERGENCY ROLLBACK PROCEDURE"
echo "======================================"

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

# Color output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log "EMERGENCY ROLLBACK INITIATED"

echo -e "${RED}════════════════════════════════════════${NC}"
echo -e "${RED}⚠️  EMERGENCY ROLLBACK - USE WITH CAUTION${NC}"
echo -e "${RED}════════════════════════════════════════${NC}"
echo ""

# Step 1: Stop Vercel
echo "Step 1: IMMEDIATELY STOP VERCEL DEPLOYMENT"
echo "  - Go to: https://vercel.com/dashboard"
echo "  - Click on dokuwiki project"
echo "  - Go to Settings > Deployments > Production"
echo "  - Disable auto-deploy or switch to a stable deployment"
echo ""
read -p "⏸️  Press ENTER when Vercel is stopped..."

log "User confirmed Vercel stopped"

# Step 2: Identify RDS snapshot
echo ""
echo "Step 2: Identify the latest RDS snapshot"
echo "  Available RDS Snapshots:"

aws rds describe-db-snapshots \
    --region "$AWS_REGION" \
    --query 'DBSnapshots[?DBInstanceIdentifier==`dokuwiki-prod-db`].[DBSnapshotIdentifier,SnapshotCreateTime,DBInstanceIdentifier]' \
    --output table | tee -a "$LOG_FILE"

read -p "📋 Enter snapshot ID to restore from: " SNAPSHOT_ID

if [[ -z "$SNAPSHOT_ID" ]]; then
    echo "❌ No snapshot ID provided - aborting"
    log "User cancelled - no snapshot ID provided"
    exit 1
fi

log "User selected snapshot: $SNAPSHOT_ID"

# Step 3: Restore RDS
echo ""
echo "Step 3: Restoring RDS from snapshot..."
echo "  This will create a new instance: dokuwiki-prod-db-restored"
echo "  ⏳ This may take 5-10 minutes..."

NEW_INSTANCE_ID="dokuwiki-prod-db-restored"

aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier "$NEW_INSTANCE_ID" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$AWS_REGION" \
    2>&1 | tee -a "$LOG_FILE"

log "Restore initiated: $NEW_INSTANCE_ID from $SNAPSHOT_ID"

# Step 4: Wait for restoration
echo ""
echo "⏳ Waiting for RDS to become available..."

aws rds wait db-instance-available \
    --db-instance-identifier "$NEW_INSTANCE_ID" \
    --region "$AWS_REGION" || log "RDS wait completed (may still be initializing)"

# Step 5: Get connection details
echo ""
echo "Step 4: RDS Restoration Complete"
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$NEW_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "✅ New RDS Instance: $NEW_INSTANCE_ID"
echo "   Endpoint: $ENDPOINT"
echo "   Status: Check AWS Console"

log "Restored RDS endpoint: $ENDPOINT"

# Step 6: Re-deploy application
echo ""
echo "Step 5: RE-DEPLOY APPLICATION"
echo "  Options:"
echo "  A) Deploy via Terraform (if code not changed)"
echo "  B) Re-enable Vercel deployment"
echo "  C) Manually deploy via AWS console"
echo ""
read -p "Choose option (A/B/C): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    A)
        echo "Running: cd /Users/mithunselvan/dokuwiki/infra && terraform apply"
        # Note: Requires manual confirmation
        ;;
    B)
        echo "Re-enable Vercel deployment via dashboard"
        ;;
    C)
        echo "Deploy manually via AWS console"
        ;;
    *)
        echo "Unknown choice - manual intervention required"
        ;;
esac

log "User selected deployment option: $DEPLOY_CHOICE"

echo ""
echo "════════════════════════════════════════"
echo "✅ ROLLBACK INITIATED"
echo "════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "  1. Monitor RDS initialization in AWS console"
echo "  2. Update application config with new RDS endpoint"
echo "  3. Re-deploy application"
echo "  4. Verify data integrity"
echo "  5. Notify team immediately"
echo ""
echo "📞 CONTACT DEVOPS TEAM FOR ASSISTANCE"
echo ""

log "Emergency rollback procedure completed - manual intervention required"
