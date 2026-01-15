#!/bin/sh
set -euo pipefail

DATA_DIR="/var/www/dokuwiki/data"
CONF_DIR="/var/www/dokuwiki/conf"
PLUGINS_DIR="/var/www/dokuwiki/lib/plugins"
SEED_DIR="/opt/dokuseed"

copy_if_empty() {
  src="$1"
  dest="$2"
  if [ -d "$dest" ] && [ "$(ls -A "$dest" 2>/dev/null)" ]; then
    return 0
  fi
  mkdir -p "$dest"
  cp -an "$src"/. "$dest"/
}

USERS_FILE="$CONF_DIR/users.auth.php"

# Seed config, users, ACL, pages, media, and plugins (add missing files; do not overwrite existing)
mkdir -p "$CONF_DIR" "$DATA_DIR" "$PLUGINS_DIR"
cp -an "$SEED_DIR/data/." "$DATA_DIR" 2>/dev/null || true
cp -an "$SEED_DIR/plugins/." "$PLUGINS_DIR" 2>/dev/null || true

# Ensure runtime dirs exist and are writable
mkdir -p "$DATA_DIR/meta" "$DATA_DIR/attic" "$DATA_DIR/cache" "$DATA_DIR/index" "$DATA_DIR/locks" "$DATA_DIR/media" "$DATA_DIR/tmp"
chown -R www-data:www-data "$DATA_DIR" "$CONF_DIR" "$PLUGINS_DIR"
find "$DATA_DIR" -type d -print0 | xargs -0 chmod 775
find "$DATA_DIR" -type f -print0 | xargs -0 chmod 664

# Ensure critical conf files exist
for cfg in local.php acl.auth.php users.auth.php; do
  if [ ! -f "$CONF_DIR/$cfg" ]; then
    cp "$SEED_DIR/conf/$cfg" "$CONF_DIR/$cfg"
    chown www-data:www-data "$CONF_DIR/$cfg"
  fi
done

# Force-insert soundpacks pages if missing
if [ ! -d "$DATA_DIR/pages/soundpacks" ]; then
  mkdir -p "$DATA_DIR/pages"
  cp -a "$SEED_DIR/data/pages/soundpacks" "$DATA_DIR/pages/"
fi

# Force-insert sidebar if missing
if [ ! -f "$DATA_DIR/pages/sidebar.txt" ]; then
  cp "$SEED_DIR/data/pages/sidebar.txt" "$DATA_DIR/pages/sidebar.txt"
fi

# Force-insert start page if missing
if [ ! -f "$DATA_DIR/pages/start.txt" ]; then
  cp "$SEED_DIR/data/pages/start.txt" "$DATA_DIR/pages/start.txt"
fi

# Force-insert recording guide namespace if missing
if [ ! -d "$DATA_DIR/pages/recording" ]; then
  mkdir -p "$DATA_DIR/pages"
  cp -a "$SEED_DIR/data/pages/recording" "$DATA_DIR/pages/"
fi

# Build index on first boot if missing
if [ ! -d "$DATA_DIR/index" ] || [ -z "$(ls -A "$DATA_DIR/index" 2>/dev/null)" ]; then
  mkdir -p "$DATA_DIR/index"
  php /var/www/dokuwiki/bin/indexer.php -c >/dev/null 2>&1 || true
fi

# Ensure users file exists
if [ ! -f "$USERS_FILE" ]; then
  touch "$USERS_FILE"
fi

create_user() {
  user="$1"; pass="$2"; groups="$3"; name="$4"; email="$5"
  if command -v openssl >/dev/null 2>&1; then
    hash=$(openssl passwd -apr1 "$pass")
  else
    # Fallback to plain crypt if openssl missing
    hash=$(php -r 'echo crypt(getenv("PASS"));' PASS="$pass")
  fi
  # Remove existing entry for user, then append
  tmpfile=$(mktemp)
  grep -v "^${user}:" "$USERS_FILE" > "$tmpfile" || true
  echo "${user}:${hash}:${name}:${email}:${groups}" >> "$tmpfile"
  mv "$tmpfile" "$USERS_FILE"
}

# Create admin from env on first boot
if grep -q '^admin:' "$USERS_FILE" 2>/dev/null; then
  :
elif [ -n "${ADMIN_PASSWORD:-}" ]; then
  create_user "admin" "$ADMIN_PASSWORD" "admin" "Admin User" "admin@example.com"
fi

# Optional demo users for testing: set DEMO_USERS=1 (passwords are predictable; do not use in prod)
if [ "${DEMO_USERS:-0}" = "1" ]; then
  grep -q '^reader:' "$USERS_FILE" || create_user "reader" "reader123" "user" "Reader" "reader@example.com"
  grep -q '^editor:' "$USERS_FILE" || create_user "editor" "editor123" "user" "Editor" "editor@example.com"
fi

# Optional one-shot backup to S3 at start
if [ "${S3_BACKUP_ON_START:-0}" = "1" ] && [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  /backup.sh || echo "[entrypoint] backup failed; continuing" >&2
fi

# Optional scheduled backups: set S3_BACKUP_CRON (e.g., "0 * * * *") and S3_BACKUP_BUCKET
if [ -n "${S3_BACKUP_CRON:-}" ] && [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  echo "${S3_BACKUP_CRON} /backup.sh >>/var/log/backup.log 2>&1" > /etc/crontabs/root
  touch /var/log/backup.log
  crond
fi

exec "$@"
