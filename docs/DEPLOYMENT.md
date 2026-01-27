# Deployment Guide - Script-Based Workflow

This guide explains the Terraform-style scriptable deployment workflow for the Next.js migration.

## Infrastructure Overview

```
┌─────────────────────────────────────────────┐
│  Route53 (DNS)                              │
│  ├─ sysya.com.au → Vercel (Next.js app)    │
│  └─ media.sysya.com.au → CloudFront (CDN)  │
└─────────────────────────────────────────────┘
         │                           │
         ↓                           ↓
    ┌─────────┐              ┌──────────────┐
    │ Vercel  │              │ CloudFront   │
    │ (FREE)  │              │ ($1-2/month) │
    └────────?   └────────?   └└?───────┘
                                     │
                                     ↓
                              ┌─────────────┐
                              │ S3 Bucket   │
                              │ (media)     │
                              └─────────────┘
```

## What Changes vs What Stays

| Component | Current | After Migration | Action |
|-----------|---------|-----------------|--------|
| App Hosting | AWS ECS Fargate | Vercel | ✅ Change |
| Media Files | S3 + CloudFront | S3 + CloudFront | ❌ Keep (no change) |
| DNS | Route53 | Route53 or Vercel | ⚠️ Update A record |
| Domain | sysya.com.au | sysya.com.au | ❌ Keep (no change) |

## Deployment Scripts (Terraform-style)

### Available Scripts

```bash
scripts/
├── setup-vercel.sh       # One-time: Install & configure Vercel
├── deploy-vercel.sh      # Deploy to Vercel (preview or production)
├── update-dns.sh         # Update Route53 DNS to point to Vercel
└── deploy-pipeline.sh    # Full pipeline: build -> test -> deploy
```

## Initial Setup (One-Time)

### Step 1: Setup Vercel

```bash
# Install Vercel CLI and link project
./scripts/setup-vercel.sh
```

This will:
- Install Vercel CLI globally
- Open browser for authentication (one-time)
- Link project to your Vercel account
- Set environment variables

### Step 2: Deploy Preview

```bash
# Deploy to preview URL for testing
./scripts/deploy-pipeline.sh preview
```

This creates a preview deployment at a temporary URL like:
`https://sysya-wiki-abc123.vercel.app`

### Step 3: Test Preview

Visit the preview URL and verify:
- All pages load correctly
- Media player works
- Links are correct
- Images display
- Mobile responsive

### Step 4: Deploy Production

```bash
# Deploy to production (your custom domain)
./scripts/deploy-pipeline.sh production
```

### Step 5: Update DNS

```bash
# Point sysya.com.au to Vercel
./scripts/update-dns.sh
```

Or manually in AWS Console:
1. Go to Route53 → Hosted Zones → sysya.com.au
2. Update A record to CNAME: `cname.vercel-dns.com`

DNS propagation takes 5-60 minutes.

## Regular Deployments

### Method 1: Script-Based (Like Terraform)

```bash
# Deploy directly
./scripts/deploy-vercel.sh production

# Or full pipeline with tests
./scripts/deploy-pipeline.sh production

# Skip tests for faster deploy
./scripts/deploy-pipeline.sh production true
```

### Method 2: Git Push (Auto-Deploy)

Once linked, Vercel auto-deploys on git push:

```bash
git add .
git commit -m "Update content"
git push origin main
# Vercel auto-deploys in ~2 minutes
```

## Script Usage

### setup-vercel.sh (One-time)

```bash
./scripts/setup-vercel.sh
```

Installs Vercel CLI, authenticates, and links project.

### deploy-vercel.sh (Repeatable)

```bash
# Deploy preview
./scripts/deploy-vercel.sh preview

# Deploy production
./scripts/deploy-vercel.sh production
```

### deploy-pipeline.sh (Full workflow)

```bash
# Preview with tests
./scripts/deploy-pipeline.sh preview

# Production with tests
./scripts/deploy-pipeline.sh production

# Production, skip tests
./scripts/deploy-pipeline.sh production true
```

Runs:
1. Build
2. Type check
3. Lint
4. Deploy to Vercel
5. (Production only) Prompt for DNS update

### update-dns.sh (One-time)

```bash
./scripts/update-dns.sh
```

Updates Route53 to point to Vercel.

## Media Files (S3 + CloudFront)

**No changes needed!** Your existing S3/CloudFront setup continues to work.

### Current Setup (Keep)
- S3 bucket: `dokuwiki-media-example`
- CloudFront domain: `media.sysya.com.au`
- Cost: ~$1-2/month

### Usage in Next.js

Reference media files in MDX:

```mdx
![Image](/path/to/image.jpg)
[Audio](https://media.sysya.com.au/audio/sample.mp3)
```

The media player automatically detects and plays these URLs.

## DNS Configuration Options

### Option 1: Keep Route53 (Recommended)

✅ Keep existing Route53 hosted zone
✅ Update A record to point to Vercel
✅ Keep media.sysya.com.au → CloudFront

```bash
./scripts/update-dns.sh
```

Cost: $0.50/month

### Option 2: Move to Vercel DNS

Transfer DNS management to Vercel (free):

1. In Vercel dashboard: Add domain
2. Get Vercel nameservers
3. Update nameservers at your registrar
4. Wait for propagation (24-48 hours)

Cost: $0/month

## Vercel CLI Commands

```bash
# Check authentication
vercel whoami

# List deployments
vercel ls

# View logs
vercel logs sysya-wiki

# Rollback to previous deployment
vercel rollback

# View environment variables
vercel env ls

# Add custom domain
vercel domains add sysya.com.au

# Check domain status
vercel domains ls
```

## Troubleshooting

### "Not logged in to Vercel"
```bash
./scripts/setup-vercel.sh
```

### "Command not found: vercel"
```bash
npm install -g vercel
```

### DNS not updating
- Check AWS credentials: `aws sts get-caller-identity`
- Verify hosted zone exists: `aws route53 list-hosted-zones`
- Wait 5-60 minutes for DNS propagation
- Check: `dig sysya.com.au`

### Build fails
```bash
cd nextjs-wiki
npm run type-check
npm run lint
```

### Preview deployment works but production doesn't
- Check custom domain is added in Vercel
- Verify DNS is pointing to Vercel
- Check SSL certificate status

## Cost Comparison

| Component | Before | After | Monthly Savings |
|-----------|--------|-------|-----------------|
| ECS Fargate | $18 | $0 | $18 |
| ALB | $22 | $0 | $22 |
| NAT Gateway | $65 | $0 | $65 |
| EFS | $3 | $0 | $3 |
| CloudWatch | $1 | $0 | $1 |
| ECR | $0.50 | $0 | $0.50 |
| Vercel | $0 | $0 | $0 |
| S3/CloudFront | $2 | $2 | $0 |
| Route53 | $0.50 | $0.50 | $0 |
| **Total** | **$112/mo** | **$2.50/mo** | **$109.50/mo** |

**Annual Savings: $1,314**

## Next Steps

1. ✅ Run `./scripts/setup-vercel.sh` (one-time)
2. ✅ Deploy preview: `./scripts/deploy-pipeline.sh preview`
3. ✅ Test preview URL thoroughly
4. ✅ Deploy production: `./scripts/deploy-pipeline.sh production`
5. ✅ Update DNS: `./scripts/update-dns.sh`
6. ✅ Wait for DNS propagation (5-60 min)
7. ✅ Verify https://sysya.com.au works
8. ✅ Run parallel for 1 week
9. ✅ Decommission AWS (see AWS-DECOMMISSION.md)

## Support

- Vercel CLI docs: https://vercel.com/docs/cli
- Vercel deployment docs: https://vercel.com/docs/deployments
- Route53 docs: https://docs.aws.amazon.com/route53/
