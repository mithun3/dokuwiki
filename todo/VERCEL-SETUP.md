# Vercel Authentication Setup - Comprehensive Analysis

## Current State Assessment

### ✅ Already Configured
- **Vercel Project Linked**: Yes - `nextjs-wiki` exists with:
  - `projectId`: `prj_CwyWDXzKa9IHDpBIUoguOU3V4OgX`
  - `orgId`: `team_tH98VMoS7j13qpHorLOYHU0h`
  - `projectName`: `nextjs-wiki`

- **Vercel Configuration File**: `vercel.json` exists with:
  - Build configuration for Next.js
  - Environment variables (NEXT_PUBLIC_CDN_URL set to `https://media.sysya.com.au`)
  - GitHub integration enabled
  - Region: `syd1` (Sydney)

- **GitHub Actions Workflows**: Both exist:
  - `.github/workflows/deploy.yml` - Production & preview deployments
  - `.github/workflows/test.yml` - Lightweight testing

### ⚠️ Status Unclear (Need Verification)
- **GitHub Secrets**: Need to check if these are set:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

- **Vercel Personal Access Token**: Unknown if created and stored

---

## Setup Script Analysis (`setup-vercel.sh`)

### Line-by-Line Breakdown

#### Phase 1: CLI Installation
- Checks if Vercel CLI installed globally
- Installs via `npm install -g vercel` if missing
- Prerequisites: npm/Node.js must be installed

#### Phase 2: User Authentication
- Runs `vercel login`
- Opens browser for OAuth authentication
- Stores token in `~/.vercel/auth.json`

#### Phase 3: Project Linking
- Runs `vercel link`
- Creates `.vercel/project.json` with org/project IDs
- Already completed (file exists)

#### Phase 4: Environment Variables
- Sets `NEXT_PUBLIC_CDN_URL` for production and preview
- Value: `https://media.sysya.com.au`

### Prerequisites
| Requirement | Status | Check |
|---|---|---|
| macOS/Linux/Windows | ✅ | macOS detected |
| Node.js 18+ | ✅ | `node --version` |
| npm | ✅ | `npm --version` |
| Internet connection | ✅ | Active |
| Browser access | ✅ | Manual verification |
| nextjs-wiki directory | ✅ | Exists |

---

## GitHub Actions Configuration

### Required Secrets (3 total)

| Secret | Source | Format | Status |
|--------|--------|--------|--------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | 40+ char alphanumeric | ❓ Unknown |
| `VERCEL_ORG_ID` | `.vercel/project.json` | `team_...` | ✅ Available |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` | `prj_...` | ✅ Available |

### Workflow Triggers

**deploy.yml**:
- Push to `main` or `migrate` → Production
- Pull requests to `main` → Preview
- Manual trigger via GitHub UI

**test.yml**:
- Push to any branch except main
- Pull requests
- Fast feedback during development

---

## Step-by-Step Execution Plan

### PRE-REQUISITES CHECKLIST

- [ ] macOS/Linux/Windows system ready
- [ ] Node.js 20+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] Vercel account created: https://vercel.com/signup
- [ ] GitHub account with repository: https://github.com
- [ ] `dokuwiki` repository cloned locally
- [ ] Internet connection available
- [ ] Browser access for OAuth flows

### PHASE 1: VERIFY VERCEL PROJECT (Already Done)

**Status**: ✅ Complete - `.vercel/project.json` exists

```bash
# Verify
cat nextjs-wiki/.vercel/project.json
# Should show: projectId, orgId, projectName

# Test Vercel CLI
vercel whoami
# Output: your-vercel-username
```

### PHASE 2: CREATE VERCEL PERSONAL ACCESS TOKEN

**Step 1**: Visit https://vercel.com/account/tokens

**Step 2**: Click "Create Token" button

**Step 3**: Configure token:
- **Token Name**: `GitHub Actions`
- **Scope**: Select "Full Account Access"
- **Expiration**: 90 days (or custom)

**Step 4**: Click "Create"

**Step 5**: Copy token immediately (won't be shown again!)
```
Format: 40+ character alphanumeric string
Example: cPu5kL9c...
```

### PHASE 3: CONFIGURE GITHUB SECRETS

#### Method A: Using GitHub CLI (Recommended)

```bash
# Prerequisites: gh CLI installed
brew install gh
gh auth login  # If not already authenticated

# Extract values from project.json
cd /Users/mithunselvan/dokuwiki
VERCEL_ORG_ID=$(cat nextjs-wiki/.vercel/project.json | grep orgId | cut -d'"' -f4)
VERCEL_PROJECT_ID=$(cat nextjs-wiki/.vercel/project.json | grep projectId | cut -d'"' -f4)

# Set secrets (replace TOKEN with actual value)
gh secret set VERCEL_TOKEN --body "YOUR_TOKEN_HERE"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
```

#### Method B: GitHub Web UI

1. Go to: https://github.com/yourusername/dokuwiki/settings/secrets/actions
2. Click "New repository secret"
3. For each secret:
   ```
   Name: VERCEL_TOKEN
   Value: cPu5...kL9c
   [Add secret]
   ```
4. Repeat for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

#### Verification

```bash
gh secret list
# Output should show:
# VERCEL_TOKEN
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID
```

### PHASE 4: CONFIGURE GITHUB ACTIONS PERMISSIONS

1. Go to: https://github.com/yourusername/dokuwiki/settings/actions/permissions
2. Select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Save

### PHASE 5: PUSH WORKFLOWS TO GITHUB

```bash
cd /Users/mithunselvan/dokuwiki

# Verify workflows exist
ls -la .github/workflows/
# Should show: deploy.yml, test.yml

# If not already pushed:
git add .github/
git commit -m "Add GitHub Actions workflows"
git push origin main
```

### PHASE 6: VERIFICATION STEPS

**Checkpoint 1**: Verify Vercel Project
```bash
cat nextjs-wiki/.vercel/project.json
# Should show: projectId, orgId, projectName
```

**Checkpoint 2**: Test Vercel CLI
```bash
vercel whoami
# Output: your-vercel-username
```

**Checkpoint 3**: Test GitHub Secrets
```bash
gh secret list
# All three secrets should be listed
```

**Checkpoint 4**: Verify Workflows on GitHub
1. Go to https://github.com/yourusername/dokuwiki/actions
2. Should see "Deploy to Vercel" and "Test" workflows
3. Status should show no errors

**Checkpoint 5**: Trigger Manual Test Deployment
1. Go to https://github.com/yourusername/dokuwiki/actions
2. Click "Deploy to Vercel"
3. Click "Run workflow" → Choose branch "main" → "Run workflow"
4. Watch progress:
   - Should see "build-and-test" start
   - Then "deploy-production"
   - Check for green checkmarks

**Checkpoint 6**: Verify Deployment
```bash
# Check Vercel deployments
vercel ls sysya-wiki

# Or visit:
# https://vercel.com/dashboard/projects
```

---

## Risk Assessment

### 🔴 Critical Security Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Token Leaked in Logs | Anyone can deploy | Never log VERCEL_TOKEN, use GitHub secrets |
| Token Exposed in .env | Credentials in repo | Always use GitHub secrets, never commit tokens |
| Token Reused Publicly | One compromise = full access | Create separate tokens per purpose |
| Secrets in Workflow Files | Visible in repository | Only use `${{ secrets.NAME }}` syntax |

### 🟡 Common Mistakes

1. **Pasting token directly in workflow YAML**
   ```yaml
   # ❌ WRONG
   vercel deploy --token=cPu5...kL9c
   
   # ✅ RIGHT
   vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
   ```

2. **Forgetting to set environment scope**
   ```bash
   # ❌ Sets only one scope
   vercel env add VAR value
   
   # ✅ Sets both
   vercel env add VAR production
   vercel env add VAR preview
   ```

3. **Token expiration during production**
   - **Symptom**: "Unauthorized" errors in workflow
   - **Solution**: Recreate token with longer expiration
   - **Monitoring**: Set calendar reminder 30 days before expiry

4. **Wrong branch triggering production**
   - **Symptom**: Deploy from feature branch to production
   - **Solution**: Verify `on.push.branches` in deploy.yml
   - **Current**: Only `[main, migrate]` can trigger production

5. **Preview deploys failing silently**
   - **Symptom**: PR has no deployment comment
   - **Solution**: Check workflow logs for GitHub permissions error

---

## Troubleshooting Common Issues

### Issue 1: "Error: Unauthorized"

**Symptoms**: Workflow fails with "Invalid token"

**Solutions**:
```bash
# Check if secret is set
gh secret list | grep VERCEL_TOKEN
# Should show: VERCEL_TOKEN (value hidden)

# If expired, create new token:
# 1. https://vercel.com/account/tokens
# 2. Create token with "Full Account Access"
# 3. gh secret set VERCEL_TOKEN --body "new-token"
```

### Issue 2: "Error: Resource not accessible by integration"

**Symptoms**: Workflow can't set variables or deploy

**Solution**:
1. Go to repo settings → Actions → Permissions
2. Enable "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Save and retry

### Issue 3: "Error: Could not find .vercel/project.json"

**Symptoms**: Workflow fails: "project.json not found"

**Solution**:
```bash
# Re-run Vercel setup
cd /Users/mithunselvan/dokuwiki
./scripts/setup-vercel.sh

# Verify creation
ls -la nextjs-wiki/.vercel/project.json

# Commit and push
git add nextjs-wiki/.vercel/
git commit -m "Add Vercel project config"
git push origin main
```

### Issue 4: "Deployment succeeds but site not updated"

**Symptoms**: Vercel shows deployment green but sysya.com.au shows old content

**Solutions**:
```bash
# Check DNS
dig sysya.com.au +short
# Should return Vercel IP

# Check Vercel dashboard
# https://vercel.com/dashboard/projects/nextjs-wiki
# Production should point to latest deployment

# Clear browser cache
# Cmd+Shift+Delete on most browsers
```

---

## Quick Reference Commands

```bash
# Verify authentication
vercel whoami

# List deployments
vercel ls sysya-wiki

# Deploy manually
./scripts/deploy-vercel.sh preview
./scripts/deploy-vercel.sh production

# Check GitHub secrets
gh secret list

# View workflow status
gh run list --limit 10

# View detailed logs
gh run view <run-id> --log
```

---

## Critical Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Vercel Projects | https://vercel.com/dashboard | View deployments |
| Vercel Tokens | https://vercel.com/account/tokens | Manage authentication |
| GitHub Actions | https://github.com/yourusername/dokuwiki/actions | Monitor workflows |
| GitHub Secrets | https://github.com/yourusername/dokuwiki/settings/secrets/actions | Manage credentials |
| Production Site | https://sysya.com.au | Verify live deployment |

---

## Execution Checklist

### PRE-EXECUTION
- [ ] Vercel account exists
- [ ] GitHub account exists
- [ ] Repository cloned
- [ ] Node.js 20+ installed
- [ ] Internet connection available
- [ ] Browser accessible

### TOKEN & SECRETS
- [ ] Personal token created at https://vercel.com/account/tokens
- [ ] Token copied to clipboard
- [ ] `VERCEL_TOKEN` secret set
- [ ] `VERCEL_ORG_ID` secret set
- [ ] `VERCEL_PROJECT_ID` secret set
- [ ] All secrets verified: `gh secret list`

### GITHUB CONFIGURATION
- [ ] Actions permissions enabled (read and write)
- [ ] Workflows pushed to GitHub
- [ ] `.github/workflows/` visible on GitHub

### FIRST DEPLOYMENT TEST
- [ ] Create feature branch
- [ ] Make minor content change
- [ ] Push and create PR
- [ ] Watch workflow run
- [ ] Preview URL appears in PR
- [ ] Test preview URL works

### PRODUCTION DEPLOYMENT
- [ ] PR approved and merged
- [ ] Push to main triggers workflow
- [ ] Production deployment completes
- [ ] Visit https://sysya.com.au
- [ ] Verify new content appears

### MONITORING
- [ ] Bookmark Vercel dashboard
- [ ] Bookmark GitHub Actions
- [ ] Set calendar reminder for token expiry (+90 days)

---

## Summary

| Task | Status | Time |
|------|--------|------|
| Vercel Project Setup | ✅ Done | - |
| Create Personal Token | ⏳ To do | 2 min |
| Set GitHub Secrets | ⏳ To do | 5 min |
| Configure Permissions | ⏳ To do | 2 min |
| Verify Setup | ⏳ To do | 5 min |
| Test Deployment | ⏳ To do | 5 min |
| **TOTAL TIME** | | **15-20 min** |

---

## Next Steps

1. Create Personal Access Token at https://vercel.com/account/tokens
2. Set GitHub secrets using `gh secret set` commands
3. Configure GitHub Actions permissions
4. Trigger test deployment from feature branch
5. Monitor workflow and verify success

**Deployment Readiness: 60% Complete** (ready to move to 80%)
