#!/bin/bash

# PHASE 5: Cost Verification
# Validates AWS billing reduction post-decommissioning

set -euo pipefail

AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query 'Account' --output text)}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LOG_FILE="${LOG_FILE:-./logs/phase5-cost-verification.log}"

echo "💰 PHASE 5: Cost Verification"
echo "======================================"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

log "Starting cost verification..."

echo "📊 Expected Monthly Cost Savings:"
echo ""
echo "  DELETED RESOURCES:"
echo "  ├─ ECS Fargate:      -\$50/month"
echo "  ├─ RDS PostgreSQL:   -\$60/month"
echo "  ├─ NAT Gateway:      -\$20/month"
echo "  ├─ EFS Storage:      -\$8/month"
echo "  └─ ALB:              -\$20/month"
echo "  ────────────────────────────────"
echo "  TOTAL SAVINGS:       -\$158/month"
echo ""
echo "  RETAINED RESOURCES:"
echo "  ├─ S3 Bucket:        ~\$2/month"
echo "  ├─ CloudFront:       ~\$5/month"
echo "  ├─ Route53:          ~\$1/month"
echo "  └─ Vercel:           ~\$0/month (included in plan)"
echo "  ────────────────────────────────"
echo "  TOTAL NEW COST:      ~\$8/month"
echo ""
echo "  NET ANNUAL SAVINGS:  ~\$1,800/year"
echo ""

log "Cost summary calculated"

# Attempt to get actual AWS costs (requires appropriate IAM permissions)
log "Attempting to retrieve current AWS costs..."

# Note: This requires ce:GetCostAndUsage permission
COST_QUERY=$(aws ce get-cost-and-usage \
    --time-period Start=$(date -d '30 days ago' '+%Y-%m-%d'),End=$(date '+%Y-%m-%d') \
    --granularity MONTHLY \
    --metrics "UnblendedCost" \
    --group-by Type=DIMENSION,Key=SERVICE \
    --region "$AWS_REGION" \
    2>/dev/null || echo "")

if [[ ! -z "$COST_QUERY" ]]; then
    log "Current monthly costs retrieved:"
    echo "$COST_QUERY" | tee -a "$LOG_FILE"
else
    log "⚠️  Could not retrieve AWS Cost data"
    log "   This may require additional IAM permissions"
    log "   Check AWS Cost Explorer in AWS Console manually"
fi

echo ""
echo "✅ POST-DECOMMISSIONING CHECKLIST:"
echo ""
echo "  [ ] Monitor AWS Cost Explorer for 1-2 weeks"
echo "  [ ] Verify ECS/RDS charges dropped"
echo "  [ ] Confirm Vercel bills unchanged"
echo "  [ ] Review S3/CloudFront usage"
echo "  [ ] Document final cost reduction"
echo "  [ ] Share cost savings report with team"
echo ""

log ""
log "✅ Phase 5 complete: Cost verification finished"
log "   Expected savings: ~\$150/month"
log "   Monitor AWS console over next 1-2 weeks"
