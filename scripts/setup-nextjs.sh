#!/bin/bash

# Next.js Migration Setup Script
# This script helps you get started with the migration

set -e

echo "🚀 Next.js Migration Setup"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -d "nextjs-wiki" ]; then
    echo "❌ Error: nextjs-wiki directory not found"
    echo "   Please run this script from the repository root"
    exit 1
fi

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/ (v18 or higher)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version too old: v$NODE_VERSION"
    echo "   Please upgrade to v18 or higher"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
cd nextjs-wiki
npm install

echo ""
echo "✅ Dependencies installed"
echo ""

# Check if Pandoc is installed
echo "🔍 Checking for Pandoc..."
if ! command -v pandoc &> /dev/null; then
    echo "⚠️  Pandoc not found (required for content conversion)"
    echo "   Install with: brew install pandoc"
    echo ""
    read -p "   Install now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v brew &> /dev/null; then
            brew install pandoc
            echo "✅ Pandoc installed"
        else
            echo "❌ Homebrew not found. Please install Pandoc manually:"
            echo "   https://pandoc.org/installing.html"
        fi
    fi
else
    echo "✅ Pandoc $(pandoc --version | head -n1) detected"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Convert DokuWiki content:"
echo "   chmod +x ../scripts/convert-to-mdx.sh"
echo "   ../scripts/convert-to-mdx.sh"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Open in browser:"
echo "   http://localhost:3000"
echo ""
echo "4. Read the migration guide:"
echo "   cat README.md"
echo ""
echo "5. Test the media player:"
echo "   Click on any audio/video link"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Full migration guide"
echo "   - AWS-DECOMMISSION.md - Infrastructure cleanup"
echo ""
