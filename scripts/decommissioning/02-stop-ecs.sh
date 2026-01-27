#!/bin/bash

# PHASE 2: Stop ECS Services
# Gracefully scale down and stop all ECS tasks

set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-dokuwiki-prod-cluster}"
SERVICE_NAME="${SERVICE_NAME:-dokuwiki-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LOG_FILE="${LOG_FILE:-./logs/phase2-stop-ecs.log}"

echo "🛑 PHASE 2: Stop ECS Services"
echo "======================================"
echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo "Region: $AWS_REGION"
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

log "Starting ECS service shutdown..."

# 1. Get current desired count
log "1. Checking current ECS service..."
CURRENT_COUNT=$(aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].desiredCount' \
    --output text 2>/dev/null || echo "0")

log "   Current desired count: $CURRENT_COUNT"

# 2. Scale down to 0
if [[ "$CURRENT_COUNT" -gt 0 ]]; then
    log "2. Scaling down to 0 tasks..."
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$SERVICE_NAME" \
        --desired-count 0 \
        --region "$AWS_REGION" \
        | tee -a "$LOG_FILE"
    
    log "   ⏳ Waiting for tasks to stop (this may take 1-2 minutes)..."
    
    # Wait for running count to reach 0
    for i in {1..60}; do
        RUNNING=$(aws ecs describe-services \
            --cluster "$CLUSTER_NAME" \
            --services "$SERVICE_NAME" \
            --region "$AWS_REGION" \
            --query 'services[0].runningCount' \
            --output text)
        
        if [[ "$RUNNING" -eq 0 ]]; then
            log "   ✓ All tasks stopped"
            break
        fi
        
        echo -n "."
        sleep 2
    done
    echo ""
else
    log "   ℹ️  Service already at 0 tasks"
fi

# 3. Stop the service
log "3. Stopping ECS service..."
aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$SERVICE_NAME" \
    --no-schedule-task-definition \
    --region "$AWS_REGION" \
    2>/dev/null || log "   ℹ️  Service update not necessary"

# 4. Verify
log "4. Verifying service stopped..."
aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].[serviceName,desiredCount,runningCount,status]' \
    --output table | tee -a "$LOG_FILE"

log ""
log "✅ Phase 2 complete: ECS services stopped"
log "   No running tasks in cluster"
