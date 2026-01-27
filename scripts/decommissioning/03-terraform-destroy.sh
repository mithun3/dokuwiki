#!/bin/bash

# PHASE 3: Infrastructure Destruction via Terraform
# Orchestrates terraform destroy with proper sequencing

set -euo pipefail

TERRAFORM_DIR="${TERRAFORM_DIR:-/Users/mithunselvan/dokuwiki/infra}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LOG_FILE="${LOG_FILE:-./logs/phase3-terraform-destroy.log}"

echo "💥 PHASE 3: Infrastructure Destruction (Terraform)"
echo "======================================"
echo "Terraform Directory: $TERRAFORM_DIR"
echo "Region: $AWS_REGION"
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

# Check terraform directory
if [[ ! -d "$TERRAFORM_DIR" ]]; then
    echo "❌ Terraform directory not found: $TERRAFORM_DIR"
    exit 1
fi

log "Starting Terraform infrastructure destruction..."

# 1. Change to terraform directory
log "1. Entering Terraform directory..."
cd "$TERRAFORM_DIR"
log "   Working directory: $(pwd)"

# 2. Initialize Terraform (if needed)
if [[ ! -d ".terraform" ]]; then
    log "2. Initializing Terraform..."
    terraform init -upgrade | tee -a "$LOG_FILE"
else
    log "2. Terraform already initialized"
fi

# 3. Refresh state
log "3. Refreshing Terraform state..."
terraform refresh -var-file="terraform.tfvars" | tee -a "$LOG_FILE" || log "   ⚠️  State refresh had warnings"

# 4. Show what will be destroyed
log "4. Planning destruction..."
terraform plan -destroy -var-file="terraform.tfvars" -out=destroy.tfplan | tee -a "$LOG_FILE"

# 5. Ask for confirmation
read -p "Review the plan above. Type 'DESTROY' to proceed: " CONFIRM
if [[ "$CONFIRM" != "DESTROY" ]]; then
    log "User cancelled destruction"
    echo "❌ Destruction cancelled by user"
    exit 0
fi

# 6. Execute destruction
log "5. Executing destruction (this may take 5-15 minutes)..."
echo "⏳ Destroying infrastructure..."

terraform destroy \
    -var-file="terraform.tfvars" \
    -auto-approve \
    -parallelism=5 \
    -lock=true \
    2>&1 | tee -a "$LOG_FILE"

# 7. Verify state
log "6. Verifying destruction..."
terraform show | tee -a "$LOG_FILE"

# 8. Archive state
log "7. Archiving Terraform state..."
mkdir -p .archive
ARCHIVE_DATE=$(date +%Y%m%d-%H%M%S)
cp terraform.tfstate* .archive/terraform.tfstate-$ARCHIVE_DATE || log "   ℹ️  No state file to archive"
log "   State archived to .archive/"

log ""
log "✅ Phase 3 complete: Infrastructure destroyed via Terraform"
log "   All resources removed except managed externally (S3, CloudFront)"
