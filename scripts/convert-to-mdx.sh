#!/bin/bash

# DokuWiki to MDX Conversion Script
# This script converts DokuWiki .txt files to MDX format for Next.js

set -e

echo "🔄 Converting DokuWiki content to MDX..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc is not installed. Installing via Homebrew..."
    brew install pandoc
fi

# Create output directory
mkdir -p nextjs-wiki/content

# Convert each .txt file to MDX
find content/pages -type f -name "*.txt" | while read -r file; do
    # Get relative path
    rel_path="${file#content/pages/}"
    
    # Change extension to .mdx
    mdx_file="nextjs-wiki/content/${rel_path%.txt}.mdx"
    
    # Create directory if needed
    mkdir -p "$(dirname "$mdx_file")"
    
    echo "Converting: $file → $mdx_file"
    
    # Extract filename for title
    filename=$(basename "$file" .txt)
    title=$(echo "$filename" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    
    # Convert with Pandoc
    {
        echo "---"
        echo "title: \"$title\""
        echo "---"
        echo ""
        pandoc -f dokuwiki -t markdown "$file"
    } > "$mdx_file"
    
    # Fix image syntax: {{:path|alt}} → ![alt](/path)
    sed -i '' 's/{{:\([^|]*\)|\([^}]*\)}}/![\2](\/\1)/g' "$mdx_file"
    
    # Fix internal links: [[namespace:page|Text]] → [Text](/namespace/page)
    sed -i '' 's/\[\[\([^:]*\):\([^|]*\)|\([^\]]*\)\]\]/[\3](\/\1\/\2)/g' "$mdx_file"
    
    # Fix simple links: [[page|Text]] → [Text](/page)
    sed -i '' 's/\[\[\([^|]*\)|\([^\]]*\)\]\]/[\2](\/\1)/g' "$mdx_file"
done

echo "✅ Conversion complete!"
echo ""
echo "📝 Manual steps required:"
echo "1. Review converted files in nextjs-wiki/content/"
echo "2. Check image paths and update if needed"
echo "3. Verify internal links work correctly"
echo "4. Add any custom MDX components if needed"
