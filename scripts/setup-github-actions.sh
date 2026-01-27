#!/bin/bash

# GitHub Actions Setup Script
# Configures GitHub secrets for automated deployments

set -e

echo "🔧 GitHub Actions Setup"
echo "======================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not installed"
    echo ""
    echo "Install with:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo ""
    echo "Then authenticate: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Authenticating with GitHub..."
    gh auth login
fi

echo "✅ Authenticated with GitHub"
echo ""

# Get Vercel token
echo "📋 Step 1: Get Vercel Token"
echo ""
echo "1. Go to: https://vercel.com/account/tokens"
echo "2. Create new token with name: 'GitHub Actions'"
echo "3. Copy the token"
echo ""
read -p "Paste your Vercel token: " VERCEL_TOKEN

# Get Vercel Org ID
echo ""
echo "📋 Step 2: Get Vercel Organization ID"
echo ""

cd nextjs-wiki

if [ -f ".vercel/project.json" ]; then
    VERCEL_ORG_ID=$(cat .vercel/project.json | grep -o '"orgId": "[^"]*"' | cut -d'"' -f4)
    VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId": "[^"]*"' | cut -d'"' -f4)
    
    echo "✅ Found IDs from .vercel/project.json"
    echo "   Org ID: $VERCEL_ORG_ID"
    echo "   Project ID: $VERCEL_PROJECT_ID"
else
    echo "⚠️  No .vercel/project.json found"
    echo "   Run: ./scripts/setup-vercel.sh first"
    cd ..
    exit 1
fi

cd ..

# Set GitHub secrets
echo ""
echo "🔒 Setting GitHub Secrets..."
echo ""

gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"

echo ""
echo "✅ GitHub secrets configured!"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║            ✅ GITHUB ACTIONS SETUP COMPLETE                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What was configured:"
echo "  ✅ VERCEL_TOKEN - For Vercel CLI authentication"
echo "  ✅ VERCEL_ORG_ID - Your Vercel organization"
echo "  ✅ VERCEL_PROJECT_ID - Project identifier"
echo ""
echo "🚀 Automated Workflows:"
echo ""
echo "  1. Push to 'main' or 'migrate' → Production deploy"
echo "  2. Pull request → Preview deploy"
echo "  3. Push to other branches → Test only"
echo ""
echo "📊 View workflows:"
echo "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
echo ""
echo "🔥 Test it now:"
echo "  git add ."
echo "  git commit -m 'Add GitHub Actions'"
echo "  git push origin migrate"
echo ""
