#!/bin/bash

# Vercel Deployment Script
# Deploy Next.js wiki to Vercel via CLI (scriptable, no UI clicks)

set -e

PROJECT_NAME="sysya-wiki"
DOMAIN="sysya.com.au"
ROOT_DIR="nextjs-wiki"

echo "🚀 Deploying Next.js Wiki to Vercel"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -d "$ROOT_DIR" ]; then
    echo "❌ Error: $ROOT_DIR directory not found"
    exit 1
fi

cd "$ROOT_DIR"

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "   Run: ./scripts/setup-vercel.sh first"
    exit 1
fi

echo "✅ Authenticated as: $(vercel whoami)"
echo ""

# Parse command line arguments
ENVIRONMENT="${1:-preview}"  # preview or production

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    echo ""
    
    # Production deployment
    vercel --prod --yes \
        --name "$PROJECT_NAME" \
        --build-env NEXT_PUBLIC_CDN_URL="https://media.$DOMAIN"
    
    echo ""
    echo "✅ Production deployment complete!"
    echo "   URL: https://$DOMAIN"
    
elif [ "$ENVIRONMENT" = "preview" ]; then
    echo "🔍 Deploying to PREVIEW..."
    echo ""
    
    # Preview deployment (for testing)
    vercel --yes \
        --name "$PROJECT_NAME" \
        --build-env NEXT_PUBLIC_CDN_URL="https://media.$DOMAIN"
    
    echo ""
    echo "✅ Preview deployment complete!"
    echo "   Check the URL printed above to test"
    
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "   Usage: ./scripts/deploy-vercel.sh [preview|production]"
    exit 1
fi

echo ""
echo "📊 Deployment Status:"
vercel ls "$PROJECT_NAME" | head -n 5

cd ..
