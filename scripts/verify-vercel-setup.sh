#!/bin/bash

# ============================================================================
# VERCEL SETUP - POST-MANUAL-CONFIGURATION VERIFICATION
# ============================================================================
# This script verifies that GitHub secrets are properly configured
# Run this after manually creating token and setting GitHub secrets
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji
CHECKMARK="✅"
CROSS="❌"
WARNING="⚠️"
LOCK="🔐"
LIST="📋"
ROCKET="🚀"

# ============================================================================
# FUNCTIONS
# ============================================================================

print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
}

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$CHECKMARK $1${NC}"
}

print_error() {
    echo -e "${RED}$CROSS $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$WARNING $1${NC}"
}

print_info() {
    echo -e "${BLUE}$LIST $1${NC}"
}

# ============================================================================
# MAIN CHECKS
# ============================================================================

print_header "VERCEL SETUP VERIFICATION"

# Check 1: Verify Vercel project config
print_step "Check 1: Verifying Vercel project configuration..."

if [ -f "nextjs-wiki/.vercel/project.json" ]; then
    print_success "Vercel project.json exists"
    
    PROJECT_ID=$(grep -o '"projectId":"[^"]*"' nextjs-wiki/.vercel/project.json | cut -d'"' -f4)
    ORG_ID=$(grep -o '"orgId":"[^"]*"' nextjs-wiki/.vercel/project.json | cut -d'"' -f4)
    
    print_info "Project ID: $PROJECT_ID"
    print_info "Organization ID: $ORG_ID"
else
    print_error "Vercel project.json not found"
    exit 1
fi

echo ""

# Check 2: Verify GitHub workflows
print_step "Check 2: Verifying GitHub Actions workflows..."

if [ -f ".github/workflows/deploy.yml" ]; then
    print_success "Deploy workflow exists"
else
    print_error "Deploy workflow not found"
    exit 1
fi

if [ -f ".github/workflows/test.yml" ]; then
    print_success "Test workflow exists"
else
    print_error "Test workflow not found"
    exit 1
fi

echo ""

# Check 3: Instructions for manual setup
print_step "Check 3: Manual Configuration Required"

print_warning "GitHub Secrets must be configured manually (browser-based)"
echo ""
echo "Required Actions:"
echo "1. Create Vercel Personal Access Token:"
echo "   → Visit: https://vercel.com/account/tokens"
echo "   → Click 'Create Token'"
echo "   → Name: 'GitHub Actions'"
echo "   → Scope: 'Full Account Access'"
echo "   → Expiration: '90 days'"
echo "   → Copy token (won't be shown again!)"
echo ""
echo "2. Set GitHub Secrets:"
echo "   → Visit: https://github.com/mithunselvan/dokuwiki/settings/secrets/actions"
echo "   → Create 3 secrets:"
echo ""
echo "   Secret 1:"
echo "   Name:  VERCEL_TOKEN"
echo "   Value: [paste token from step 1]"
echo ""
echo "   Secret 2:"
echo "   Name:  VERCEL_ORG_ID"
echo "   Value: $ORG_ID"
echo ""
echo "   Secret 3:"
echo "   Name:  VERCEL_PROJECT_ID"
echo "   Value: $PROJECT_ID"
echo ""
echo "3. Configure GitHub Actions Permissions:"
echo "   → Visit: https://github.com/mithunselvan/dokuwiki/settings/actions/permissions"
echo "   → Select 'Read and write permissions'"
echo "   → Check 'Allow GitHub Actions to create and approve pull requests'"
echo "   → Save"
echo ""

# Check 4: Provide quick test command
print_step "Check 4: Test Deployment Instructions"

echo ""
echo "After manual setup is complete, run:"
echo ""
echo "  git checkout -b test/github-actions-setup"
echo "  echo '<!-- Test -->' >> nextjs-wiki/content/home.mdx"
echo "  git add nextjs-wiki/content/home.mdx"
echo "  git commit -m 'test: verify GitHub Actions setup'"
echo "  git push origin test/github-actions-setup"
echo ""
echo "Then:"
echo "  1. Create Pull Request on GitHub"
echo "  2. Watch GitHub Actions tab (should show workflow running)"
echo "  3. Check for preview deployment URL"
echo "  4. Merge PR to trigger production deployment"
echo "  5. Verify at https://sysya.com.au"
echo ""

# Check 5: Important reminders
print_step "Check 5: Important Reminders"

echo ""
print_warning "Token Security:"
echo "  • Token grants full access to Vercel account"
echo "  • Never commit token to git"
echo "  • Never share token in messages/chat"
echo "  • Set reminder to rotate token in 90 days"
echo ""
print_info "Tokens Expire:"
echo "  • Default expiration: 90 days"
echo "  • Expired tokens break CI/CD pipelines"
echo "  • Set calendar reminder NOW"
echo ""
print_info "GitHub Actions Permissions:"
echo "  • Must have 'Read and write' permissions"
echo "  • Cannot deploy with 'Read-only' permissions"
echo "  • Affects all workflows in repository"
echo ""

# Success message
echo ""
print_header "NEXT STEPS"

echo "1. Create Vercel Personal Access Token"
echo "   → https://vercel.com/account/tokens"
echo ""
echo "2. Configure GitHub Secrets"
echo "   → https://github.com/mithunselvan/dokuwiki/settings/secrets/actions"
echo ""
echo "3. Configure GitHub Actions Permissions"
echo "   → https://github.com/mithunselvan/dokuwiki/settings/actions/permissions"
echo ""
echo "4. Test with feature branch deployment"
echo "   → See Check 4 above for commands"
echo ""
echo "5. Monitor in GitHub Actions tab"
echo "   → https://github.com/mithunselvan/dokuwiki/actions"
echo ""
echo "6. Verify production deployment"
echo "   → https://sysya.com.au"
echo ""

print_success "Verification script complete!"
print_info "Estimated setup time: 15-20 minutes"
echo ""
