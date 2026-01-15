# DokuWiki AWS + Local Scaffold

This repository seeds infrastructure, application image, and content-as-code for DokuWiki.

- `infra/`: Terraform skeleton (AWS provider, tagging, backend placeholders). Add modules for VPC, ALB/WAF, EFS, compute (ECS/EC2), Route53, ACM, backups.
- `app/`: Dockerfile with nginx + php-fpm + DokuWiki (stable tarball), supervisor, nginx/php configs, and volume mounts for persistence.
- `content/`: Markdown-first authoring folder; mount into the container or convert via CI before deploy.
- `docker-compose.yml`: local runner exposing http://localhost:8080; volumes keep data/config/plugins persistent on your machine. Use `ADMIN_PASSWORD=changeme DEMO_USERS=1` for seeded users; set `S3_BACKUP_BUCKET` (+ optional `S3_BACKUP_PREFIX`, `S3_BACKUP_ON_START=1`) to snapshot state to S3 at startup; set `S3_BACKUP_CRON` for recurring uploads. Nginx is configured for DokuWiki pretty URLs.

Next steps:
1) Initialize Terraform backend (S3 + DynamoDB), then create modules and per-env stacks under `infra/`.
2) Build/push the app image to ECR; wire ECS/ALB/EFS in Terraform.
3) Configure Route53 zone/records + ACM cert; attach WAF managed rules.
4) Define a content pipeline (Markdown -> DokuWiki) and media hosting on S3/CloudFront.
5) Enable backups: EFS snapshot before deploys; S3 versioning for media.

Emergency edits (UI-first, persist back to git):
- Make the change in the running wiki UI.
- Copy live state to the repo for review: `docker compose cp dokuwiki:/var/www/dokuwiki/data ./app/live-data` and `docker compose cp dokuwiki:/var/www/dokuwiki/conf ./app/live-conf` (and `lib/plugins` if you installed plugins).
- Move the edited files you care about into app/seed (pages, media, conf), check `git diff`, then commit.
- Rebuild/restart to ensure the seeded image matches git.

User and ACL management (git-first, no drift):
- Conf is bind-mounted from `app/seed/conf`, so UI edits to users/ACL write directly into git-tracked files.
- Keep admin secrets out of git: leave `admin` out of `app/seed/conf/users.auth.php`; set `ADMIN_PASSWORD` at runtime and the entrypoint will add/update `admin`.
- Add users via UI, then `git status` → review → commit. Alternatively, from the host:
	- `docker compose exec dokuwiki sh -c 'hash=$(openssl passwd -apr1 "$PASS"); echo "alice:${hash}:Alice Example:alice@example.com:user" >> /var/www/dokuwiki/conf/users.auth.php'`
	- Replace PASS with a temporary env var; do not store plaintext in git.
- ACL changes via UI land in `app/seed/conf/acl.auth.php`; review and commit.
- If you ever reintroduce volumes, `docker compose cp` the conf/data back into `app/seed` before committing to avoid drift.
