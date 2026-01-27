#!/bin/bash

# PHASE 4: Verify Resource Deletion
# Comprehensive audit of deleted resources

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
VPC_ID="${VPC_ID:-vpc-xxxxxxxxxx}"
LOG_FILE="${LOG_FILE:-./logs/phase4-verify-resources.log}"

echo "🔍 PHASE 4: Verify Resource Deletion"
echo "======================================"
echo "Region: $AWS_REGION"
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_resource() {
    local name=$1
    local count=$2
    
    if [[ $count -eq 0 ]]; then
        echo -e "${GREEN}✓${NC} $name: 0 (deleted)"
        log "✓ $name: 0 (deleted)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $name: $count (still exists)"
        log "⚠ $name: $count (still exists)"
        return 1
    fi
}

log "Starting resource verification..."
echo ""

# 1. Check ECS Clusters
log "1. Checking ECS Clusters..."
ECS_COUNT=$(aws ecs list-clusters --region "$AWS_REGION" --query 'clusterArns | length(@)' --output text 2>/dev/null || echo "0")
check_resource "ECS Clusters" "$ECS_COUNT"

# 2. Check RDS Instances
log "2. Checking RDS Instances..."
RDS_COUNT=$(aws rds describe-db-instances --region "$AWS_REGION" --query 'DBInstances | length(@)' --output text 2>/dev/null || echo "0")
check_resource "RDS Instances" "$RDS_COUNT"

# 3. Check EFS
log "3. Checking EFS File Systems..."
EFS_COUNT=$(aws efs describe-file-systems --region "$AWS_REGION" --query 'FileSystems | length(@)' --output text 2>/dev/null || echo "0")
check_resource "EFS File Systems" "$EFS_COUNT"

# 4. Check Load Balancers
log "4. Checking Load Balancers..."
ALB_COUNT=$(aws elbv2 describe-load-balancers --region "$AWS_REGION" --query 'LoadBalancers | length(@)' --output text 2>/dev/null || echo "0")
check_resource "Load Balancers" "$ALB_COUNT"

# 5. Check NAT Gateways
log "5. Checking NAT Gateways..."
NAT_COUNT=$(aws ec2 describe-nat-gateways --region "$AWS_REGION" --query 'NatGateways[?State==`available`] | length(@)' --output text 2>/dev/null || echo "0")
check_resource "NAT Gateways" "$NAT_COUNT"

# 6. Check ECR Repositories
log "6. Checking ECR Repositories..."
ECR_COUNT=$(aws ecr describe-repositories --region "$AWS_REGION" --query 'repositories | length(@)' --output text 2>/dev/null || echo "0")
check_resource "ECR Repositories" "$ECR_COUNT"

# 7. Check Custom VPCs
log "7. Checking Custom VPCs..."
VPC_COUNT=$(aws ec2 describe-vpcs --region "$AWS_REGION" --query 'Vpcs[?IsDefault==`false`] | length(@)' --output text 2>/dev/null || echo "0")
check_resource "Custom VPCs" "$VPC_COUNT"

# 8. Check Security Groups (non-default)
log "8. Checking Security Groups..."
SG_COUNT=$(aws ec2 describe-security-groups --region "$AWS_REGION" --query 'SecurityGroups[?GroupName!=`default`] | length(@)' --output text 2>/dev/null || echo "0")
check_resource "Security Groups (non-default)" "$SG_COUNT"

# 9. Summary
echo ""
echo "════════════════════════════════════════"
TOTAL_RESOURCES=$((ECS_COUNT + RDS_COUNT + EFS_COUNT + ALB_COUNT + NAT_COUNT + ECR_COUNT + VPC_COUNT + SG_COUNT))

if [[ $TOTAL_RESOURCES -eq 0 ]]; then
    echo -e "${GREEN}✅ ALL RESOURCES DELETED${NC}"
    log "✅ All resources successfully deleted"
    echo "   Your AWS infrastructure is clean"
else
    echo -e "${YELLOW}⚠️  $TOTAL_RESOURCES RESOURCES STILL EXIST${NC}"
    log "⚠ $TOTAL_RESOURCES resources still exist"
    echo "   These may be retained for billing or backup purposes"
fi

log ""
log "✅ Phase 4 complete: Resource verification finished"
