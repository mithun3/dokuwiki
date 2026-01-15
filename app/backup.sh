#!/bin/sh
set -euo pipefail

# Optional S3 backup of wiki state (no DB required).
# Uses aws-cli and standard AWS env/role credentials.

DATA_ROOT="/var/www/dokuwiki"
ARCHIVE="/tmp/dokuwiki-backup-$(date +%Y%m%d%H%M%S).tar.gz"
BUCKET="${S3_BACKUP_BUCKET:-}"
PREFIX="${S3_BACKUP_PREFIX:-dokuwiki}"

if [ -z "$BUCKET" ]; then
  echo "[backup] S3_BACKUP_BUCKET not set; skipping backup"
  exit 0
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "[backup] aws CLI not found; skipping backup" >&2
  exit 1
fi

cd "$DATA_ROOT"

tar -czf "$ARCHIVE" \
  --warning=no-file-changed \
  --exclude='data/cache' \
  --exclude='data/index' \
  --exclude='data/locks' \
  --exclude='data/tmp' \
  conf \
  data \
  lib/plugins

target="s3://$BUCKET/$PREFIX/$(basename "$ARCHIVE")"
aws s3 cp "$ARCHIVE" "$target"

echo "[backup] uploaded $target"
