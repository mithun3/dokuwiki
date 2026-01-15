# Content as Code

- Author posts as Markdown under `pages/` (e.g., `pages/2026-01-hello-world.md`).
- Media binaries live under `media/` and should be stored in S3/CloudFront for production; keep small placeholders here for previews.
- If you mount these into the container (`docker-compose.yml` commented lines), ensure a Markdown-to-DokuWiki plugin is enabled inside the wiki.
- For production, prefer a CI step that converts or syncs Markdown into DokuWiki pages before deploy.
