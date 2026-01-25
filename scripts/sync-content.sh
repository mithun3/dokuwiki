#!/usr/bin/env bash
set -euo pipefail

# Sync content from content/pages/*.md to EFS via ECS exec
# Usage: AWS_PROFILE=my-creds ./scripts/sync-content.sh

log() { echo "[sync] $*"; }

: "${AWS_REGION:=ap-southeast-2}"
: "${CLUSTER:=dokuwiki-prod-cluster}"
: "${SERVICE:=dokuwiki-prod-svc}"
: "${CONTAINER:=dokuwiki}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT_DIR="$ROOT/content/pages"
PAGES_PATH="/var/www/dokuwiki/data/pages"

# Get task ARN
log "Getting task ARN..."
TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER" --service-name "$SERVICE" --region "$AWS_REGION" --query 'taskArns[0]' --output text)
TASK_ID=$(echo "$TASK_ARN" | awk -F'/' '{print $NF}')
log "Task: $TASK_ID"

# Function to run command in container
exec_cmd() {
  aws ecs execute-command \
    --cluster "$CLUSTER" \
    --task "$TASK_ID" \
    --container "$CONTAINER" \
    --interactive \
    --command "$1" \
    --region "$AWS_REGION" 2>/dev/null | grep -v "Session Manager plugin" | grep -v "Starting session" | grep -v "Exiting session"
}

# Function to upload file content
upload_file() {
  local src="$1"
  local dest="$2"
  local content
  
  # Read and escape for shell
  content=$(cat "$src" | sed "s/'/'\\\\''/g")
  
  # Create directory and write file
  local dir=$(dirname "$dest")
  exec_cmd "sh -c 'mkdir -p $dir && printf \"%s\" \"$content\" > $dest && chown www-data:www-data $dest'"
}

# Sync all DokuWiki files
log "Syncing content..."

find "$CONTENT_DIR" -name "*.txt" -type f | while read -r src; do
  # Get relative path
  rel="${src#$CONTENT_DIR/}"
  dest="$PAGES_PATH/$rel"
  
  log "Syncing: $rel -> $dest"
  upload_file "$src" "$dest"
done

log "Done! Content synced to EFS."
log "Note: You may need to clear DokuWiki cache at /var/www/dokuwiki/data/cache"
