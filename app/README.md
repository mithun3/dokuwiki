# App Image Scaffold

- Dockerfile builds a combined nginx + php-fpm image with DokuWiki pulled from the stable tarball.
- `supervisord` keeps nginx and php-fpm running in one container for simplicity.
- Volumes are declared for `data/`, `conf/`, and `lib/plugins/` so state can persist or be mounted from EFS in AWS.
- `php.ini` increases upload/memory limits; adjust as needed for large media.
- Optional S3 backup: set `S3_BACKUP_BUCKET` (optional `S3_BACKUP_PREFIX`, `S3_BACKUP_ON_START=1`) for a one-shot upload at start. For recurring uploads, set `S3_BACKUP_CRON` (e.g., `0 * * * *`) and ensure AWS creds/role are available; `backup.sh` tars `conf/`, `data/`, and `lib/plugins` excluding caches.

Local usage:
- `ADMIN_PASSWORD=changeme DEMO_USERS=1 docker compose up --build` from repo root (exposes http://localhost:8080) — seeds config, users, and pages; no installer needed. Env vars are now wired in docker-compose.yml defaults.
- Optionally mount git-managed pages/media by uncommenting the volume lines in `docker-compose.yml`.
- Add real media files under `app/seed/data/media/recording/` and `app/seed/data/media/soundpacks/` so embeds resolve.

AWS notes:
- Build and push this image to ECR; mount EFS at the three volume paths for persistence across tasks/instances.
- Front with ALB/CloudFront + WAF; use ACM cert for your Route53 domain.
