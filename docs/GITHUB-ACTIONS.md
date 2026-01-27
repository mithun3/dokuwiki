# GitHub Actions - Automated Deployments

This document explains the fully automated CI/CD pipeline using GitHub Actions.

## Overview

**Zero-click deployments**: Push to git → automatic testing, building, and deployment.

```
┌─────────────────────────────────────────────────────────┐
│  Developer Workflow                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  git add .                                              │
│  git commit -m "Update content"                         │
│  git push origin main                                   │
│                                                         │
│  ↓                                                      │
│  GitHub Actions automatically:                          │
│    1. Type checks code                                  │
│    2. Lints code                                        │
│    3. Builds application                                │
│    4. Deploys to Vercel                                 │
│                                                         │
│  ✅ Live in ~2 minutes                                  │
└─────────────────────────────────────────────────────────┘
```

## Workflows

### 1. **deploy.yml** - Main Deployment Pipeline

**Triggers:**
- Push to `main` or `migrate` → Production deployment
- Pull request to `main` → Preview deployment
- Manual trigger via GitHub UI

**Jobs:**
1. **build-and-test** - Validates code
   - Type checking (`npm run type-check`)
   - Linting (`npm run lint`)
   - Build verification
   
2. **deploy-preview** - Preview deployments
   - Runs on pull requests
   - Creates temporary preview URL
   - Ideal for testing before merge
   
3. **deploy-production** - Production deployments
   - Runs on push to `main`/`migrate`
   - Deploys to sysya.com.au
   - Automatic rollback on failure

### 2. **test.yml** - Lightweight Testing

**Triggers:**
- Push to any branch except `main`
- Pull requests

**Purpose:**
- Fast feedback during development
- Validates code before deployment
- No deployment, just testing

## Setup Instructions

### Prerequisites

1. **GitHub repository** (existing or new)
2. **Vercel account** with project linked
3. **GitHub CLI** installed (optional, for scripted setup)

### One-Time Setup

#### Option 1: Automated (Recommended)

```bash
# 1. Install GitHub CLI
brew install gh

# 2. Link repository (if not already)
git remote add origin https://github.com/yourusername/dokuwiki.git
git push -u origin migrate

# 3. Run setup script
./scripts/setup-github-actions.sh
```

#### Option 2: Manual Setup

1. **Get Vercel Token:**
   - Visit: https://vercel.com/account/tokens
   - Create token: "GitHub Actions"
   - Copy the token

2. **Get Vercel IDs:**
   ```bash
   cd nextjs-wiki
   cat .vercel/project.json
   ```
   Copy `orgId` and `projectId`

3. **Add GitHub Secrets:**
   - Go to: `https://github.com/yourusername/dokuwiki/settings/secrets/actions`
   - Add these secrets:
     - `VERCEL_TOKEN` → Your Vercel token
     - `VERCEL_ORG_ID` → Organization ID from project.json
     - `VERCEL_PROJECT_ID` → Project ID from project.json

4. **Push workflows:**
   ```bash
   git add .github/workflows/
   git commit -m "Add GitHub Actions"
   git push origin migrate
   ```

## Usage

### Automatic Production Deployment

```bash
# Update content
vim content/recording.mdx

# Commit and push
git add content/
git commit -m "Update recording guide"
git push origin main

# GitHub Actions automatically:
# ✅ Tests code
# ✅ Builds application  
# ✅ Deploys to production
# ✅ Available at sysya.com.au in ~2 minutes
```

### Preview Deployment (via PR)

```bash
# Create feature branch
git checkout -b feature/new-content

# Make changes
vim content/sounds.mdx

# Push and create PR
git add content/
git commit -m "Add new sounds section"
git push origin feature/new-content

# Create PR on GitHub
gh pr create --title "Add new sounds" --body "New content for sounds section"

# GitHub Actions automatically:
# ✅ Tests code
# ✅ Deploys preview to temporary URL
# 💬 Comments on PR with preview link
```

### Manual Trigger

Via GitHub UI:
1. Go to: `https://github.com/yourusername/dokuwiki/actions`
2. Select "Deploy to Vercel"
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow"

## Workflow Comparison

| Method | Trigger | Use Case | Speed |
|--------|---------|----------|-------|
| **Script** | Manual command | Testing locally, one-off deploys | ~3-5 min |
| **GitHub Actions** | Git push | Regular updates, team collaboration | ~2 min |
| **Vercel Git** | Git push (Vercel integration) | Simplest, no Actions needed | ~1-2 min |

## Monitoring

### View Workflow Status

```bash
# Via CLI
gh run list

# Via web
open "https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
```

### Check Logs

```bash
# Latest run
gh run view

# Specific run
gh run view <run-id>

# Download logs
gh run download <run-id>
```

### Get Deployment URL

```bash
# List deployments
gh api repos/:owner/:repo/deployments | jq '.[0].url'
```

## Comparison: Scripts vs Actions

### Local Scripts (Terraform-style)

**Pros:**
- ✅ Full control over process
- ✅ Works offline (except deploy step)
- ✅ No GitHub dependency
- ✅ Immediate feedback

**Cons:**
- ❌ Requires manual execution
- ❌ No audit trail
- ❌ Team needs setup on each machine

```bash
./scripts/deploy-pipeline.sh production
```

### GitHub Actions (CI/CD)

**Pros:**
- ✅ Zero-click deployments
- ✅ Built-in audit trail
- ✅ Works for entire team
- ✅ Preview deployments on PRs
- ✅ Automatic rollbacks

**Cons:**
- ❌ Requires GitHub
- ❌ ~2 min delay for Actions to start
- ❌ Debugging requires log inspection

```bash
git push  # That's it!
```

### Recommendation

**Use both:**
- **GitHub Actions** for regular deployments (git push workflow)
- **Scripts** for testing, emergency deploys, local development

## Customization

### Deploy Only on Content Changes

Modify `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'nextjs-wiki/content/**'
      - 'nextjs-wiki/src/**'
      - 'nextjs-wiki/package*.json'
```

### Add Slack Notifications

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Performance Budget

```yaml
- name: Check bundle size
  run: |
    SIZE=$(du -sk .next | cut -f1)
    if [ $SIZE -gt 5000 ]; then
      echo "❌ Bundle too large: ${SIZE}KB"
      exit 1
    fi
```

## Troubleshooting

### "Error: Vercel token invalid"

```bash
# Generate new token
open https://vercel.com/account/tokens

# Update GitHub secret
gh secret set VERCEL_TOKEN
```

### "Error: Resource not accessible by integration"

Check GitHub Actions permissions:
1. Settings → Actions → General
2. Workflow permissions → Read and write permissions
3. Save

### Deployment succeeds but site not updated

- Check Vercel dashboard: https://vercel.com/dashboard
- Verify deployment domain is correct
- Check DNS propagation: `dig sysya.com.au`

### Slow deployments

Typical times:
- GitHub Actions start: ~30 seconds
- Install dependencies: ~45 seconds
- Build: ~30 seconds  
- Deploy: ~20 seconds
- **Total: ~2 minutes**

To speed up:
- Use npm cache (already configured)
- Skip tests on urgent deploys: `git push --no-verify`
- Use script for local testing: `./scripts/deploy-vercel.sh production`

## Cost

GitHub Actions free tier:
- **2,000 minutes/month** for private repos
- **Unlimited** for public repos

Average deployment:
- ~2 minutes per deployment
- **1,000 deployments/month** on free tier

Cost: **$0/month** for typical usage

## Migration Path

### Phase 1: Setup (Now)
```bash
./scripts/setup-github-actions.sh
git push origin migrate
```

### Phase 2: Testing (1-2 days)
- Let Actions run on feature branches
- Verify preview deployments work
- Check logs for issues

### Phase 3: Production (After validation)
```bash
git checkout main
git merge migrate
git push origin main
# Automatic production deployment!
```

### Phase 4: Team Adoption
- Document workflow in README
- Remove manual deployment steps
- Keep scripts for emergencies

## Next Steps

1. ✅ Run `./scripts/setup-github-actions.sh`
2. ✅ Push to GitHub: `git push origin migrate`
3. ✅ Watch first deployment in Actions tab
4. ✅ Test preview deployment via PR
5. ✅ Merge to main for production

See [DEPLOYMENT.md](DEPLOYMENT.md) for script-based deployments.
