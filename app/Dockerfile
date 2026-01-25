FROM php:8.2-fpm-alpine

ARG DOKUWIKI_TARBALL_URL=https://download.dokuwiki.org/src/dokuwiki/dokuwiki-stable.tgz
ENV DOKUWIKI_PATH=/var/www/dokuwiki

# Install nginx, supervisor, and PHP extensions DokuWiki relies on
RUN set -eux; \
    apk add --no-cache \
      nginx \
      supervisor \
      curl \
      tar \
      tzdata \
      libjpeg-turbo \
      libpng \
      freetype \
      libzip \
      libxml2 \
      aws-cli; \
    apk add --no-cache --virtual .build-deps \
      libjpeg-turbo-dev \
      libpng-dev \
      freetype-dev \
      libzip-dev \
      libxml2-dev \
      ${PHPIZE_DEPS}; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install gd zip xml; \
    docker-php-ext-enable opcache; \
    apk del .build-deps; \
    mkdir -p /run/nginx /var/log/nginx ${DOKUWIKI_PATH}

# Fetch and unpack DokuWiki (tarball extracts to a dated folder)
RUN set -eux; \
  curl -fsSL "${DOKUWIKI_TARBALL_URL}" -o /tmp/dokuwiki.tgz; \
  tar -xzf /tmp/dokuwiki.tgz -C /tmp; \
  extracted_dir=$(tar -tzf /tmp/dokuwiki.tgz | head -1 | cut -d/ -f1); \
  rm -rf "${DOKUWIKI_PATH}"; \
  mv "/tmp/${extracted_dir}" "${DOKUWIKI_PATH}"; \
  rm -f "${DOKUWIKI_PATH}/install.php"; \
  rm /tmp/dokuwiki.tgz; \
  [ -f "${DOKUWIKI_PATH}/doku.php" ]; \
  chown -R www-data:www-data "${DOKUWIKI_PATH}"; \
  # Backup built-in plugins so we can restore them after EFS mount
  cp -a "${DOKUWIKI_PATH}/lib/plugins" /opt/plugins-builtin; \
  # Clear any cache artifacts from fresh install (ensures clean image)
  rm -rf "${DOKUWIKI_PATH}/data/cache"/* \
         "${DOKUWIKI_PATH}/data/index"/* \
         "${DOKUWIKI_PATH}/data/tmp"/* \
         "${DOKUWIKI_PATH}/data/locks"/*

# Seed config that will be copied to writable volumes on first run
COPY app/seed/ /opt/dokuseed/

# Copy content pages (pre-converted to DokuWiki .txt format) to seed directory
COPY content/pages/ /opt/dokuseed/data/pages/

# Entrypoint handles first-run seeding (conf/users/acl/pages) and then starts supervisord
COPY app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Config files
COPY app/nginx.conf /etc/nginx/nginx.conf
COPY app/supervisord.conf /etc/supervisord.conf
COPY app/php.ini /usr/local/etc/php/conf.d/dokuwiki.ini
COPY app/backup.sh /backup.sh

# Custom branding assets (logo, favicon, etc.)
# Copy assets directory, then move files if they exist
COPY content/assets/ /tmp/assets/
RUN if [ -f /tmp/assets/logo.png ]; then \
      cp /tmp/assets/logo.png /var/www/dokuwiki/lib/tpl/dokuwiki/images/logo.png; \
    fi && \
    if [ -f /tmp/assets/favicon.ico ]; then \
      cp /tmp/assets/favicon.ico /var/www/dokuwiki/lib/tpl/dokuwiki/images/favicon.ico; \
    fi && \
    if [ -f /tmp/assets/apple-touch-icon.png ]; then \
      cp /tmp/assets/apple-touch-icon.png /var/www/dokuwiki/lib/tpl/dokuwiki/images/apple-touch-icon.png; \
    fi && \
    rm -rf /tmp/assets && \
    chown -R www-data:www-data /var/www/dokuwiki/lib/tpl/dokuwiki/images/

VOLUME ["/var/www/dokuwiki/data", "/var/www/dokuwiki/conf", "/var/www/dokuwiki/lib/plugins"]

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
