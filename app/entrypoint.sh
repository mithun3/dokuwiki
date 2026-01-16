#!/bin/sh
set -euo pipefail

log() { echo "[entrypoint] $*"; }

DATA_DIR="/var/www/dokuwiki/data"
CONF_DIR="/var/www/dokuwiki/conf"
PLUGINS_DIR="/var/www/dokuwiki/lib/plugins"
PLUGINS_BUILTIN="/opt/plugins-builtin"
SEED_DIR="/opt/dokuseed"

log "Starting entrypoint..."
log "DATA_DIR=$DATA_DIR"
log "CONF_DIR=$CONF_DIR"
log "SEED_DIR=$SEED_DIR"

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
log "Creating directories: $CONF_DIR, $DATA_DIR, $PLUGINS_DIR"
mkdir -p "$CONF_DIR" "$DATA_DIR" "$PLUGINS_DIR"

log "Seeding data from $SEED_DIR/data/..."
cp -an "$SEED_DIR/data/." "$DATA_DIR" 2>/dev/null || true

# IMPORTANT: Restore built-in plugins first (EFS mount shadows them)
# Use -a (archive) without -n to ensure built-in plugins are present even if directory has content
log "Restoring built-in DokuWiki plugins from $PLUGINS_BUILTIN..."
for plugin in "$PLUGINS_BUILTIN"/*; do
  pluginname=$(basename "$plugin")
  if [ ! -d "$PLUGINS_DIR/$pluginname" ]; then
    log "Copying built-in plugin: $pluginname"
    cp -a "$plugin" "$PLUGINS_DIR/"
  else
    log "Plugin already exists: $pluginname"
  fi
done

log "Seeding custom plugins from $SEED_DIR/lib/plugins/..."
cp -an "$SEED_DIR/lib/plugins/." "$PLUGINS_DIR" 2>/dev/null || true

# Verify authplain plugin exists
if [ -d "$PLUGINS_DIR/authplain" ]; then
  log "authplain plugin verified: $PLUGINS_DIR/authplain"
  ls -la "$PLUGINS_DIR/authplain" | head -5
else
  log "WARNING: authplain plugin NOT found at $PLUGINS_DIR/authplain"
fi

# Ensure runtime dirs exist and are writable
log "Creating runtime directories..."
mkdir -p "$DATA_DIR/meta" "$DATA_DIR/attic" "$DATA_DIR/cache" "$DATA_DIR/index" "$DATA_DIR/locks" "$DATA_DIR/media" "$DATA_DIR/tmp" "$DATA_DIR/media_attic" "$DATA_DIR/media_meta" "$DATA_DIR/pages" "$DATA_DIR/log/error" "$DATA_DIR/log/deprecated" "$DATA_DIR/log/debug"

log "Setting ownership..."
chown -R www-data:www-data "$DATA_DIR" "$CONF_DIR" "$PLUGINS_DIR"

log "Setting permissions on DATA_DIR..."
find "$DATA_DIR" -type d -exec chmod 775 {} +
find "$DATA_DIR" -type f -exec chmod 664 {} +

# Ensure critical conf files exist
log "Checking critical config files..."
for cfg in local.php acl.auth.php users.auth.php; do
  if [ ! -f "$CONF_DIR/$cfg" ]; then
    log "Copying missing config: $cfg"
    cp "$SEED_DIR/conf/$cfg" "$CONF_DIR/$cfg"
    chown www-data:www-data "$CONF_DIR/$cfg"
  else
    log "Config exists: $cfg"
  fi
done

# Force re-seed ALL config files if local.php is missing required keys (indicates broken state)
log "Checking if config needs full reseed..."
if ! grep -q "hidewarnings" "$CONF_DIR/local.php" 2>/dev/null; then
  log "Re-seeding ALL config files (broken state detected)"
  cp -f "$SEED_DIR/conf/local.php" "$CONF_DIR/local.php"
  cp -f "$SEED_DIR/conf/acl.auth.php" "$CONF_DIR/acl.auth.php"
  cp -f "$SEED_DIR/conf/users.auth.php" "$CONF_DIR/users.auth.php"
  chown www-data:www-data "$CONF_DIR"/*.php
else
  log "Config appears valid"
fi

# Debug: show current users.auth.php content
log "Current users.auth.php content:"
cat "$CONF_DIR/users.auth.php" 2>/dev/null || log "users.auth.php not readable"

# Fix users.auth.php if it has Apache-style hashes OR if it doesn't have bcrypt hashes
if grep -q '\$apr1\$' "$CONF_DIR/users.auth.php" 2>/dev/null || ! grep -q '\$2y\$' "$CONF_DIR/users.auth.php" 2>/dev/null; then
  log "Fixing users.auth.php (incorrect or missing bcrypt hashes)"
  cp -f "$SEED_DIR/conf/users.auth.php" "$CONF_DIR/users.auth.php"
  chown www-data:www-data "$CONF_DIR/users.auth.php"
  chmod 660 "$CONF_DIR/users.auth.php"
  log "Updated users.auth.php:"
  cat "$CONF_DIR/users.auth.php"
fi

# Ensure all config files are readable by www-data
log "Setting permissions on all config files..."
chown -R www-data:www-data "$CONF_DIR"
find "$CONF_DIR" -type f -exec chmod 664 {} +
find "$CONF_DIR" -type d -exec chmod 775 {} +

log "Contents of $CONF_DIR:"
ls -la "$CONF_DIR" || true

log "Contents of local.php:"
cat "$CONF_DIR/local.php" || true

log "Contents of $DATA_DIR:"
ls -la "$DATA_DIR" || true

log "Contents of $DATA_DIR/pages:"
ls -la "$DATA_DIR/pages" 2>/dev/null || log "pages dir missing or empty"

# Force-insert soundpacks pages if missing
if [ ! -d "$DATA_DIR/pages/soundpacks" ]; then
  log "Copying soundpacks pages..."
  mkdir -p "$DATA_DIR/pages"
  cp -a "$SEED_DIR/data/pages/soundpacks" "$DATA_DIR/pages/"
fi

# Force-insert sidebar if missing
if [ ! -f "$DATA_DIR/pages/sidebar.txt" ]; then
  log "Copying sidebar.txt..."
  cp "$SEED_DIR/data/pages/sidebar.txt" "$DATA_DIR/pages/sidebar.txt"
fi

# Force-insert home page if missing
if [ ! -f "$DATA_DIR/pages/home.txt" ]; then
  log "Copying home.txt..."
  cp "$SEED_DIR/data/pages/home.txt" "$DATA_DIR/pages/home.txt"
fi

# Force-insert recording guide namespace if missing
if [ ! -d "$DATA_DIR/pages/recording" ]; then
  log "Copying recording pages..."
  mkdir -p "$DATA_DIR/pages"
  cp -a "$SEED_DIR/data/pages/recording" "$DATA_DIR/pages/"
fi

# Build index on first boot if missing
if [ ! -d "$DATA_DIR/index" ] || [ -z "$(ls -A "$DATA_DIR/index" 2>/dev/null)" ]; then
  log "Building search index..."
  mkdir -p "$DATA_DIR/index"
  php /var/www/dokuwiki/bin/indexer.php -c >/dev/null 2>&1 || true
fi

log "Final state of pages:"
ls -laR "$DATA_DIR/pages" 2>/dev/null | head -50 || log "pages dir missing"

log "Entrypoint setup complete, starting supervisord..."

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
