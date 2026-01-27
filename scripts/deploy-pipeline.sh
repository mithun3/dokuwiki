#!/bin/bash

# Complete Deployment Pipeline
# Orchestrates: build -> test -> deploy -> DNS

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          Next.js Wiki - Deployment Pipeline               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Parse arguments
ENVIRONMENT="${1:-preview}"
SKIP_TESTS="${2:-false}"

if [ "$ENVIRONMENT" != "preview" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo ""
    echo "Usage: ./scripts/deploy-pipeline.sh [preview|production] [skip-tests]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy-pipeline.sh preview           # Deploy preview with tests"
    echo "  ./scripts/deploy-pipeline.sh production        # Deploy production with tests"
    echo "  ./scripts/deploy-pipeline.sh production true   # Deploy production, skip tests"
    exit 1
fi

echo "🎯 Target: $ENVIRONMENT"
echo "🧪 Tests: $([ "$SKIP_TESTS" = "true" ] && echo "Skipped" || echo "Enabled")"
echo ""

# Step 1: Build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/5: Building Next.js Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd nextjs-wiki

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔨 Building..."
npm run build

echo "✅ Build successful"
echo ""

# Step 2: Type Check
if [ "$SKIP_TESTS" != "true" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 2/5: Type Checking"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    npm run type-check
    echo "✅ Type check passed"
    echo ""
fi

# Step 3: Lint
if [ "$SKIP_TESTS" != "true" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 3/5: Linting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    npm run lint
    echo "✅ Lint passed"
    echo ""
fi

cd ..

# Step 4: Deploy to Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4/5: Deploying to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./scripts/deploy-vercel.sh "$ENVIRONMENT"

# Step 5: DNS Update (only for production)
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 5/5: DNS Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    read -p "Update DNS to point to Vercel? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/update-dns.sh
    else
        echo "⏭️  Skipping DNS update"
        echo ""
        echo "To update DNS later, run:"
        echo "  ./scripts/update-dns.sh"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                  ✅ DEPLOYMENT COMPLETE                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Production URL: https://sysya.com.au"
    echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
else
    echo "🔍 Preview URL: Check output above"
fi

echo ""
echo "📚 Next Steps:"
echo "  1. Test the deployment thoroughly"
echo "  2. Monitor for any issues"
if [ "$ENVIRONMENT" = "preview" ]; then
    echo "  3. Deploy to production: ./scripts/deploy-pipeline.sh production"
else
    echo "  3. Decommission AWS: See nextjs-wiki/AWS-DECOMMISSION.md"
fi
echo ""
