#!/bin/sh
# Convert markdown files to DokuWiki syntax
# Usage: md2doku.sh <input_dir> <output_dir>

set -eu

INPUT_DIR="${1:-/opt/content/pages}"
OUTPUT_DIR="${2:-/opt/dokuseed/data/pages}"

log() { echo "[md2doku] $*"; }

convert_file() {
  src="$1"
  dest="$2"
  
  # Create destination directory
  mkdir -p "$(dirname "$dest")"
  
  # Convert markdown to DokuWiki syntax
  # Step 1: Basic conversions, then convert / to : in wiki links
  sed \
    -e 's/^# \(.*\)/====== \1 ======/' \
    -e 's/^## \(.*\)/===== \1 =====/' \
    -e 's/^### \(.*\)/==== \1 ====/' \
    -e 's/^#### \(.*\)/=== \1 ===/' \
    -e 's/^- /  * /' \
    -e 's/^  - /    * /' \
    -e 's/^    - /      * /' \
    -e 's/^1\. /  - /' \
    -e 's/^2\. /  - /' \
    -e 's/^3\. /  - /' \
    -e 's/^4\. /  - /' \
    -e 's/^5\. /  - /' \
    -e 's/\*\*\([^*]*\)\*\*/*\1*/g' \
    -e 's/`\([^`]*\)`/'"'"'\1'"'"'/g' \
    -e 's/!\[\([^]]*\)\](\([^)]*\))/{{:\2|\1}}/g' \
    -e 's/\[\([^]]*\)\](\([^)]*\)\.md)/[[\2|\1]]/g' \
    -e 's/\[\([^]]*\)\](\([^)]*\))/[[\2|\1]]/g' \
    "$src" | \
  # Step 2: Convert / to : inside wiki links (repeat to handle multiple slashes)
  sed -e 's|\[\[\([^]/|]*\)/|\[[\1:|g' \
      -e 's|\[\[\([^]/|]*\)/|\[[\1:|g' \
      -e 's|\[\[\([^]/|]*\)/|\[[\1:|g' > "$dest"
  
  log "Converted: $src -> $dest"
}

log "Converting markdown to DokuWiki syntax..."
log "Input: $INPUT_DIR"
log "Output: $OUTPUT_DIR"

# Find all .md files and convert
find "$INPUT_DIR" -name "*.md" -type f | while read -r mdfile; do
  # Calculate relative path
  relpath="${mdfile#$INPUT_DIR/}"
  # Change extension from .md to .txt
  txtpath="${relpath%.md}.txt"
  destfile="$OUTPUT_DIR/$txtpath"
  
  convert_file "$mdfile" "$destfile"
done

log "Conversion complete"
