#!/usr/bin/env sh
set -e
cid=$(docker compose ps -q dokuwiki)
docker cp content/pages/. "$cid":/var/www/dokuwiki/data/pages/
docker cp content/media/. "$cid":/var/www/dokuwiki/data/media/