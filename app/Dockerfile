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
  cp -a "${DOKUWIKI_PATH}/lib/plugins" /opt/plugins-builtin

# Seed config/content that will be copied to writable volumes on first run
COPY seed/ /opt/dokuseed/

# Entrypoint handles first-run seeding (conf/users/acl/pages) and then starts supervisord
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Config files
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisord.conf
COPY php.ini /usr/local/etc/php/conf.d/dokuwiki.ini
COPY backup.sh /backup.sh

VOLUME ["/var/www/dokuwiki/data", "/var/www/dokuwiki/conf", "/var/www/dokuwiki/lib/plugins"]

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
