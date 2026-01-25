# DokuWiki AWS + Local Scaffold

This repository seeds infrastructure, application image, and content-as-code for DokuWiki.

- `infra/`: Terraform skeleton (AWS provider, tagging, backend placeholders). Add modules for VPC, ALB/WAF, EFS, compute (ECS/EC2), Route53, ACM, backups.
- `app/`: Dockerfile with nginx + php-fpm + DokuWiki (stable tarball), supervisor, nginx/php configs, and volume mounts for persistence.
- `content/pages/`: DokuWiki-native `.txt` files (git-tracked source of truth for pages).
- `docker-compose.yml`: local runner exposing http://localhost:8080; volumes keep data/config/plugins persistent on your machine. Use `ADMIN_PASSWORD=changeme DEMO_USERS=1` for seeded users; set `S3_BACKUP_BUCKET` (+ optional `S3_BACKUP_PREFIX`, `S3_BACKUP_ON_START=1`) to snapshot state to S3 at startup; set `S3_BACKUP_CRON` for recurring uploads. Nginx is configured for DokuWiki pretty URLs.

---

## 🚨 CRITICAL: Domain Nameserver Configuration

When deploying to AWS with a custom domain, you **MUST** configure your domain's nameservers at your registrar. Without this step, SSL certificate validation will hang indefinitely.

### Why This Is Required

Terraform creates a Route53 hosted zone with unique AWS nameservers. For DNS to work, your domain registrar must delegate DNS authority to these nameservers. Each time the hosted zone is recreated (e.g., after `terraform destroy`), **new nameservers are assigned** and must be updated at your registrar.

### Step-by-Step Instructions

#### 1. Get the Nameservers from Terraform Output

After running `terraform apply`, look for the `hosted_zone_nameservers` output:

```
Outputs:

hosted_zone_nameservers = tolist([
  "ns-1833.awsdns-37.co.uk",
  "ns-383.awsdns-47.com",
  "ns-570.awsdns-07.net",
  "ns-1433.awsdns-51.org",
])
```

Or retrieve them with AWS CLI:
```bash
AWS_PROFILE=my-creds aws route53 get-hosted-zone \
  --id $(terraform output -raw hosted_zone_id) \
  --query 'DelegationSet.NameServers' --output table
```

#### 2. Update Your Domain Registrar

Log into your domain registrar and update the nameserver records:

| Registrar | Navigation Path |
|-----------|-----------------|
| **Namecheap** | Domain List → Manage → Nameservers → Custom DNS |
| **GoDaddy** | My Products → DNS → Nameservers → Change → Enter my own |
| **Cloudflare** | Select Domain → DNS → Change nameservers |
| **Google Domains** | My domains → DNS → Name servers → Use custom |
| **AWS Route53 Registrar** | Registered domains → Select domain → Add/edit name servers |

**Enter all 4 nameservers** exactly as shown in the Terraform output.

#### 3. Wait for DNS Propagation

DNS changes can take **5 minutes to 48 hours** to propagate globally (typically 5-15 minutes).

### DNS Verification Commands

**Check nameservers using `dig`:**
```bash
# Basic NS lookup
dig NS sysya.com.au +short

# More detailed output
dig NS sysya.com.au

# Query specific DNS servers to check propagation:
dig NS sysya.com.au @8.8.8.8 +short      # Google DNS
dig NS sysya.com.au @1.1.1.1 +short      # Cloudflare DNS
dig NS sysya.com.au @208.67.222.222 +short  # OpenDNS
```

**Check nameservers using `nslookup`:**
```bash
nslookup -type=NS sysya.com.au
nslookup -type=NS sysya.com.au 8.8.8.8   # Query Google DNS
```

**Check nameservers using `host`:**
```bash
host -t NS sysya.com.au
```

**Verify ACM validation CNAME record resolves:**
```bash
# Get the validation record name from AWS
AWS_PROFILE=my-creds aws acm describe-certificate \
  --certificate-arn $(terraform output -raw app_cert_arn 2>/dev/null || echo "CERT_ARN") \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord.Name' --output text

# Then verify it resolves
dig CNAME _validation-record-name.sysya.com.au +short
```

**Monitor propagation (macOS - no `watch` by default):**
```bash
# Loop to check every 30 seconds
while true; do clear; date; echo "--- NS Records ---"; dig NS sysya.com.au @8.8.8.8 +short; sleep 5; done

# Or install watch: brew install watch
watch -n 30 'dig NS sysya.com.au @8.8.8.8 +short'
```

**Compare current vs expected nameservers:**
```bash
echo "=== Current (from Google DNS) ===" && \
dig NS sysya.com.au @8.8.8.8 +short && \
echo "" && echo "=== Expected (from AWS) ===" && \
AWS_PROFILE=my-creds aws route53 get-hosted-zone \
  --id $(terraform output -raw hosted_zone_id) \
  --query 'DelegationSet.NameServers[]' --output text | tr '\t' '\n'
```

**Online DNS propagation checkers:**
- https://dnschecker.org - Check propagation globally
- https://mxtoolbox.com/DNSLookup.aspx
- https://www.whatsmydns.net

**Expected output when propagation is complete:**
```
ns-1833.awsdns-37.co.uk.
ns-383.awsdns-47.com.
ns-570.awsdns-07.net.
ns-1433.awsdns-51.org.
```

#### 4. ACM Certificate Validation Completes

Once DNS propagates, AWS ACM will automatically validate your certificate. The Terraform apply will continue and complete.

### Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| `aws_acm_certificate_validation.main[0]: Still creating...` loops forever | Nameservers not configured at registrar | Update NS records at registrar |
| Certificate validated before but now hanging | Hosted zone was recreated with new NS | Update NS records with new values |
| `dig NS domain.com` returns old nameservers | DNS not propagated yet | Wait 5-15 minutes and retry |
| `dig NS domain.com` returns nothing | Domain not pointing to any nameservers | Verify registrar settings |

### Re-running After `terraform destroy`

⚠️ **Important**: Every `terraform destroy` and `terraform apply` cycle creates a **new hosted zone with new nameservers**. You must update your registrar each time.

---

## Development & Deployment

### Local Development (localhost)

Run DokuWiki locally for development and testing:

```bash
# Start with docker-compose
docker-compose up --build

# Visit http://localhost:8080

# With admin password and demo users
ADMIN_PASSWORD=changeme DEMO_USERS=1 docker-compose up --build

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

### Local Build & Deploy to AWS

Build the Docker image locally and deploy to your AWS ECS cluster:

```bash
# 1. Login to ECR
AWS_PROFILE=my-creds aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin 462634386575.dkr.ecr.ap-southeast-2.amazonaws.com

# 2. Build image (linux/amd64 for ECS Fargate)
docker build --platform linux/amd64 \
  -t 462634386575.dkr.ecr.ap-southeast-2.amazonaws.com/dokuwiki-app-repo:latest \
  -f app/Dockerfile .

# 3. Push to ECR
docker push 462634386575.dkr.ecr.ap-southeast-2.amazonaws.com/dokuwiki-app-repo:latest

# 4. Deploy (force new ECS task)
AWS_PROFILE=my-creds aws ecs update-service \
  --cluster dokuwiki-prod-cluster \
  --service dokuwiki-prod-svc \
  --force-new-deployment \
  --region ap-southeast-2

# 5. Monitor deployment
AWS_PROFILE=my-creds aws ecs describe-services \
  --cluster dokuwiki-prod-cluster \
  --services dokuwiki-prod-svc \
  --region ap-southeast-2 \
  --query 'services[0].deployments[*].{Status:status,Running:runningCount,Pending:pendingCount}'
```

**Or use the deploy script:**
```bash
AWS_PROFILE=my-creds IMAGE=462634386575.dkr.ecr.ap-southeast-2.amazonaws.com/dokuwiki-app-repo:latest \
  ./scripts/deploy-ecr-image.sh
```

### CI/CD via GitHub Actions

Push to `main` branch triggers automatic build and deploy:
- Changes to `app/**`, `infra/**`, or `scripts/**` trigger the Build & Push workflow
- The workflow builds, pushes to ECR, and deploys to ECS

Manual trigger: Go to **Actions** → **Build & Push Image** → **Run workflow**

---

## 🧹 Cache Management

DokuWiki caches rendered pages, search indexes, and temporary data for performance. Changes to configuration, pages, or plugins require cache clearing to take effect immediately.

### How Cache Invalidation Works

We implement a **3-layer cache strategy**:

1. **Docker Build Time** - Cache directories are cleared when building the image
2. **Container Startup** - Optional cache clear via `CLEAR_CACHE_ON_START=1` environment variable
3. **Post-Deployment** - GitHub Actions workflow clears cache 2 minutes after ECS deploy completes

### Cache Locations

DokuWiki uses these directories for caching:

```
/var/www/dokuwiki/data/
├── cache/      # Rendered page cache (HTML output)
├── index/      # Full-text search index
├── tmp/        # Temporary work files
└── locks/      # Write lock files
```

### Clear Cache: Local Development

**Option 1: Restart container with cache clear flag**
```bash
CLEAR_CACHE_ON_START=1 docker-compose up -d dokuwiki
```

**Option 2: Manual clear (container running)**
```bash
docker-compose exec dokuwiki sh -c '\
  rm -rf /var/www/dokuwiki/data/cache/* && \
  rm -rf /var/www/dokuwiki/data/index/* && \
  rm -rf /var/www/dokuwiki/data/tmp/* && \
  echo "✓ Cache cleared"'
```

**Option 3: CLI inside container**
```bash
docker-compose exec dokuwiki sh
# rm -rf /var/www/dokuwiki/data/cache/*
# rm -rf /var/www/dokuwiki/data/index/*
# rm -rf /var/www/dokuwiki/data/tmp/*
```

### Clear Cache: Production (ECS)

**Automatic**: Deployed after each successful `Deploy to ECS` workflow run (runs ~2 minutes after deploy).

**Manual: Via AWS CLI**
```bash
# 1. Get running task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster dokuwiki-prod-cluster \
  --service-name dokuwiki-prod-svc \
  --desired-status RUNNING \
  --query 'taskArns[0]' --output text \
  --region ap-southeast-2)

# 2. Execute clear command
aws ecs execute-command \
  --cluster dokuwiki-prod-cluster \
  --task "$TASK_ARN" \
  --container dokuwiki \
  --interactive \
  --command "/bin/sh -c 'rm -rf /var/www/dokuwiki/data/cache/* && rm -rf /var/www/dokuwiki/data/index/* && rm -rf /var/www/dokuwiki/data/tmp/* && echo \"Cache cleared\"'" \
  --region ap-southeast-2
```

**Manual: Via deploy script**
```bash
AWS_PROFILE=my-creds ./scripts/deploy-ecr-image.sh --clear-cache
```

### When to Clear Cache

- **After config changes** - If `local.php` has been modified (e.g., title, theme)
- **After plugin installation/update** - New plugins or plugin versions need index rebuild
- **After content bulk imports** - Large page uploads or migrations
- **After page deletes** - Ensure old pages aren't served from cache
- **Troubleshooting** - Always try clearing cache before debugging rendering issues

### Disable Automatic Cache Clear

If you want to keep cache on container restart:

```bash
# docker-compose.yml or ECS task definition
CLEAR_CACHE_ON_START=0
```

Or don't set it (defaults to `0`).

---

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
