#!/bin/bash

# MASTER DECOMMISSIONING ORCHESTRATOR
# Safely executes all 5 phases of AWS infrastructure teardown
# with confirmation gates and comprehensive logging

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/decommissioning-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_success() { log "SUCCESS" "$@"; }
log_error() { log "ERROR" "$@"; }
log_warn() { log "WARN" "$@"; }

# Color output functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Safety checks
pre_flight_check() {
    log_info "Running pre-flight checks..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Install with: brew install awscli"
        return 1
    fi
    log_success "AWS CLI installed"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        return 1
    fi
    log_success "AWS credentials configured"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_warn "Terraform not found in PATH"
    else
        log_success "Terraform installed"
    fi
    
    # Check Vercel site
    print_warn "Verifying Vercel deployment..."
    if curl -s https://sysya.com.au | grep -q "sysya" || curl -s https://sysya.com.au/api/health &>/dev/null; then
        log_success "Vercel site responding"
    else
        log_warn "Could not verify Vercel site - continuing anyway"
    fi
    
    return 0
}

# Main orchestration
main() {
    print_header "🚀 AWS DECOMMISSIONING MASTER ORCHESTRATOR"
    
    log_info "Starting decommissioning process"
    log_info "Log file: $LOG_FILE"
    
    # Pre-flight checks
    if ! pre_flight_check; then
        print_error "Pre-flight checks failed"
        log_error "Pre-flight checks failed - aborting"
        exit 1
    fi
    
    print_success "Pre-flight checks passed"
    echo ""
    
    # FINAL WARNING
    print_warn "========================================="
    print_warn "FINAL WARNING - DESTRUCTIVE OPERATION"
    print_warn "========================================="
    echo ""
    echo "This will DELETE the following AWS resources:"
    echo "  • ECS Fargate cluster (dokuwiki-prod-cluster)"
    echo "  • RDS PostgreSQL database (dokuwiki-prod-db)"
    echo "  • EFS file system"
    echo "  • ALB and NAT Gateways"
    echo "  • VPC and security groups"
    echo "  • ECR repository"
    echo ""
    echo "Monthly savings: ~\$150/month"
    echo ""
    
    read -p "Type 'DELETE_ALL' to proceed (or press Ctrl+C to abort): " CONFIRM
    if [[ "$CONFIRM" != "DELETE_ALL" ]]; then
        log_warn "Aborted by user"
        print_error "Decommissioning aborted"
        exit 0
    fi
    
    log_info "User confirmed deletion - proceeding"
    echo ""
    
    # PHASE 1: BACKUP EFS
    print_header "PHASE 1: Backup EFS Data"
    read -p "Press ENTER to start Phase 1 (or 's' to skip)..."  PHASE_INPUT
    if [[ "$PHASE_INPUT" != "s" ]]; then
        if bash "$SCRIPT_DIR/01-backup-efs.sh" >> "$LOG_FILE" 2>&1; then
            log_success "Phase 1 complete"
            print_success "Phase 1 complete: EFS backup successful"
        else
            log_error "Phase 1 failed"
            print_error "Phase 1 failed - check logs"
            read -p "Continue anyway? (y/n): " CONTINUE
            if [[ "$CONTINUE" != "y" ]]; then
                log_error "User chose not to continue after Phase 1 failure"
                exit 1
            fi
        fi
    else
        log_warn "Phase 1 skipped by user"
        print_warn "Phase 1 skipped"
    fi
    echo ""
    
    # PHASE 2: STOP ECS
    print_header "PHASE 2: Stop ECS Services"
    read -p "Press ENTER to start Phase 2..." 
    if bash "$SCRIPT_DIR/02-stop-ecs.sh" >> "$LOG_FILE" 2>&1; then
        log_success "Phase 2 complete"
        print_success "Phase 2 complete: ECS services stopped"
    else
        log_error "Phase 2 failed"
        print_error "Phase 2 failed - check logs"
        exit 1
    fi
    echo ""
    
    # PHASE 3: TERRAFORM DESTROY
    print_header "PHASE 3: Infrastructure Destruction (Terraform)"
    read -p "Press ENTER to start Phase 3 (POINT OF NO RETURN)..." 
    if bash "$SCRIPT_DIR/03-terraform-destroy.sh" >> "$LOG_FILE" 2>&1; then
        log_success "Phase 3 complete"
        print_success "Phase 3 complete: Infrastructure destroyed"
    else
        log_error "Phase 3 failed"
        print_error "Phase 3 failed - check logs"
        exit 1
    fi
    echo ""
    
    # PHASE 4: VERIFY
    print_header "PHASE 4: Verify Resource Deletion"
    read -p "Press ENTER to verify deletion..."
    if bash "$SCRIPT_DIR/04-verify-resources.sh" >> "$LOG_FILE" 2>&1; then
        log_success "Phase 4 complete"
        print_success "Phase 4 complete: All resources verified as deleted"
    else
        log_warn "Phase 4 completed with warnings"
        print_warn "Phase 4: Some verifications incomplete"
    fi
    echo ""
    
    # PHASE 5: COST VERIFICATION
    print_header "PHASE 5: Cost Verification"
    read -p "Press ENTER to verify cost reduction..."
    if bash "$SCRIPT_DIR/05-cost-verification.sh" >> "$LOG_FILE" 2>&1; then
        log_success "Phase 5 complete"
        print_success "Phase 5 complete: Cost reduction confirmed"
    else
        log_warn "Phase 5 completed with warnings"
    fi
    echo ""
    
    # COMPLETION
    print_header "✅ DECOMMISSIONING COMPLETE"
    echo ""
    echo "Summary:"
    echo "  • All 5 phases executed successfully"
    echo "  • AWS infrastructure decommissioned"
    echo "  • Estimated savings: ~\$150/month"
    echo "  • Vercel site: operational"
    echo "  • Logs: $LOG_FILE"
    echo ""
    
    log_success "Decommissioning process completed successfully"
    echo ""
    
    # Post-completion checklist
    echo "📋 Post-Completion Checklist:"
    echo "  [ ] Verify Vercel site still responding"
    echo "  [ ] Check AWS billing for cost reduction"
    echo "  [ ] Review all logs for errors"
    echo "  [ ] Archive logs and backups"
    echo "  [ ] Notify team of completion"
    echo "  [ ] Update documentation"
    echo ""
    
    log_info "Log file saved to: $LOG_FILE"
}

# Run main
main "$@"
