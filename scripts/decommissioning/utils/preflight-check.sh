#!/bin/bash

# UTILITY: Pre-Flight Checks
# Validates all prerequisites before decommissioning

set -euo pipefail

LOG_FILE="${LOG_FILE:-./logs/preflight-check.log}"

echo "🔍 PRE-FLIGHT CHECKS"
echo "======================================"

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@" | tee -a "$LOG_FILE"
}

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    log "✓ $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    log "✗ $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    log "⚠ $1"
}

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# 1. Check AWS CLI
log "1. Checking AWS CLI..."
if command -v aws &> /dev/null; then
    check_pass "AWS CLI installed: $(aws --version)"
    ((CHECKS_PASSED++))
else
    check_fail "AWS CLI not found"
    ((CHECKS_FAILED++))
fi

# 2. Check AWS credentials
log "2. Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text)
    check_pass "AWS credentials valid (Account: $ACCOUNT)"
    ((CHECKS_PASSED++))
else
    check_fail "AWS credentials not configured"
    ((CHECKS_FAILED++))
fi

# 3. Check Terraform
log "3. Checking Terraform..."
if command -v terraform &> /dev/null; then
    TF_VERSION=$(terraform version -json | grep terraform_version | head -1 | cut -d'"' -f4)
    check_pass "Terraform installed: $TF_VERSION"
    ((CHECKS_PASSED++))
else
    check_warn "Terraform not found (required for destroy)"
    ((CHECKS_WARNING++))
fi

# 4. Check curl/Vercel connectivity
log "4. Checking Vercel connectivity..."
if curl -s --connect-timeout 5 https://sysya.com.au > /dev/null 2>&1; then
    check_pass "Vercel site responding"
    ((CHECKS_PASSED++))
else
    check_warn "Could not reach Vercel site (may be in maintenance)"
    ((CHECKS_WARNING++))
fi

# 5. Check terraform directory
log "5. Checking Terraform directory..."
if [[ -d "/Users/mithunselvan/dokuwiki/infra" ]]; then
    check_pass "Terraform directory found"
    ((CHECKS_PASSED++))
else
    check_fail "Terraform directory not found"
    ((CHECKS_FAILED++))
fi

# 6. Check terraform.tfvars
log "6. Checking Terraform variables..."
if [[ -f "/Users/mithunselvan/dokuwiki/infra/terraform.tfvars" ]]; then
    check_pass "Terraform variables file exists"
    ((CHECKS_PASSED++))
else
    check_warn "terraform.tfvars not found"
    ((CHECKS_WARNING++))
fi

# 7. Check jq (for JSON parsing)
log "7. Checking jq..."
if command -v jq &> /dev/null; then
    check_pass "jq installed"
    ((CHECKS_PASSED++))
else
    check_warn "jq not found (optional for enhanced output)"
    ((CHECKS_WARNING++))
fi

# 8. Check available disk space
log "8. Checking disk space..."
AVAILABLE=$(df / | awk 'NR==2 {print $4}')
if [[ $AVAILABLE -gt 5242880 ]]; then  # 5GB
    check_pass "Sufficient disk space: $(numfmt --to=iec $AVAILABLE 2>/dev/null || echo "$AVAILABLE KB")"
    ((CHECKS_PASSED++))
else
    check_fail "Insufficient disk space: $(numfmt --to=iec $AVAILABLE 2>/dev/null || echo "$AVAILABLE KB")"
    ((CHECKS_FAILED++))
fi

# 9. Check backup directory
log "9. Checking backup directory..."
BACKUP_DIR="${BACKUP_LOCAL_PATH:-.}/backups"
if [[ -d "$BACKUP_DIR" ]] || mkdir -p "$BACKUP_DIR" 2>/dev/null; then
    check_pass "Backup directory ready: $BACKUP_DIR"
    ((CHECKS_PASSED++))
else
    check_fail "Cannot create backup directory"
    ((CHECKS_FAILED++))
fi

# Summary
echo ""
echo "════════════════════════════════════════"
echo "SUMMARY:"
echo "  Passed:  $CHECKS_PASSED"
echo "  Warnings: $CHECKS_WARNING"
echo "  Failed:  $CHECKS_FAILED"
echo "════════════════════════════════════════"

if [[ $CHECKS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    log "✅ All pre-flight checks passed"
    exit 0
elif [[ $CHECKS_FAILED -gt 0 ]]; then
    echo -e "${RED}❌ CRITICAL CHECKS FAILED - ABORTING${NC}"
    log "❌ Critical checks failed"
    exit 1
else
    echo -e "${YELLOW}⚠️  WARNINGS PRESENT - PROCEED WITH CAUTION${NC}"
    log "⚠️  Warnings present but proceeding"
    exit 0
fi
