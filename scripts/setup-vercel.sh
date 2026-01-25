#!/bin/bash

# Vercel Project Configuration Script
# One-time setup to link local project to Vercel

set -e

echo "🔧 Vercel Project Setup"
echo "======================="
echo ""

cd nextjs-wiki

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI globally..."
    npm install -g vercel
fi

# Login to Vercel (opens browser)
echo "🔐 Logging in to Vercel..."
echo "   (This will open your browser for authentication)"
echo ""
vercel login

echo ""
echo "✅ Logged in as: $(vercel whoami)"
echo ""

# Link project to Vercel
echo "🔗 Linking project to Vercel..."
echo ""
echo "Answer the prompts:"
echo "  - Set up and deploy: No (we'll deploy via script)"
echo "  - Which scope: Choose your account"
echo "  - Link to existing project: No"
echo "  - Project name: sysya-wiki"
echo "  - Directory: ./ (current directory)"
echo ""

vercel link

echo ""
echo "✅ Project linked!"
echo ""

# Set environment variables
echo "🔧 Setting environment variables..."
vercel env add NEXT_PUBLIC_CDN_URL production <<< "https://media.sysya.com.au"
vercel env add NEXT_PUBLIC_CDN_URL preview <<< "https://media.sysya.com.au"

echo ""
echo "✅ Environment variables configured"
echo ""

cd ..

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║               ✅ VERCEL SETUP COMPLETE                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What was configured:"
echo "  ✅ Vercel CLI installed and authenticated"
echo "  ✅ Project linked to your Vercel account"
echo "  ✅ Environment variables set"
echo "  ✅ Ready for deployments"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "  1. Deploy preview:"
echo "     ./scripts/deploy-pipeline.sh preview"
echo ""
echo "  2. Deploy production:"
echo "     ./scripts/deploy-pipeline.sh production"
echo ""
echo "  3. Auto-deploy on git push:"
echo "     - Push to GitHub"
echo "     - Vercel auto-deploys on push to main/migrate"
echo ""
