# VERCEL AUTHENTICATION SETUP - IMPLEMENTATION GUIDE

## Current Status ✅

- ✅ Vercel project linked and configured
- ✅ IDs extracted successfully
- ⏳ GitHub secrets need to be configured
- ⏳ Vercel Personal Access Token needs to be created

---

## STEP 1: Create Vercel Personal Access Token

### Instructions:

1. **Visit**: https://vercel.com/account/tokens

2. **Click "Create Token"** button

3. **Configure Token Settings**:
   - **Token Name**: `GitHub Actions`
   - **Scope**: Select `Full Account Access`
   - **Expiration**: 90 days (or longer if preferred)

4. **Click "Create"**

5. **Copy the token immediately** - it won't be shown again!
   - Token format: 40+ character alphanumeric string
   - Example format: `cPu5kL9c...` (full token about 45+ chars)

6. **Store this value securely** - you'll need it in Step 2

### ⚠️ Important:
- **Never commit this token to git**
- **Never share this token**
- **This token grants full access to your Vercel account**
- Set calendar reminder 90 days from now to rotate/recreate token

---

## STEP 2: Configure GitHub Secrets

### Option A: Using GitHub Web UI (Recommended if CLI not set up)

1. **Go to your repository settings**:
   - URL: `https://github.com/mithunselvan/dokuwiki/settings/secrets/actions`
   - OR: GitHub → Your Repo → Settings → Secrets and variables → Actions

2. **Click "New repository secret"** button

3. **Add Secret #1: VERCEL_TOKEN**
   - **Name**: `VERCEL_TOKEN`
   - **Value**: Paste the token from Step 1
   - Click "Add secret"

4. **Click "New repository secret"** button again

5. **Add Secret #2: VERCEL_ORG_ID**
   - **Name**: `VERCEL_ORG_ID`
   - **Value**: `team_tH98VMoS7j13qpHorLOYHU0h`
   - Click "Add secret"

6. **Click "New repository secret"** button again

7. **Add Secret #3: VERCEL_PROJECT_ID**
   - **Name**: `VERCEL_PROJECT_ID`
   - **Value**: `prj_CwyWDXzKa9IHDpBIUoguOU3V4OgX`
   - Click "Add secret"

8. **Verify all three secrets are listed**:
   - You should see them in the secrets list (values hidden for security)

### Option B: Using GitHub CLI (After authentication)

```bash
# First authenticate
gh auth login
# Follow prompts to authenticate with GitHub

# Then set each secret
gh secret set VERCEL_TOKEN --body "YOUR_TOKEN_HERE"
gh secret set VERCEL_ORG_ID --body "team_tH98VMoS7j13qpHorLOYHU0h"
gh secret set VERCEL_PROJECT_ID --body "prj_CwyWDXzKa9IHDpBIUoguOU3V4OgX"

# Verify
gh secret list
# Output should show all three secrets
```

---

## STEP 3: Configure GitHub Actions Permissions

1. **Go to Actions permissions**:
   - URL: `https://github.com/mithunselvan/dokuwiki/settings/actions/permissions`
   - OR: Settings → Actions → General → Permissions

2. **Under "Workflow permissions"**:
   - ✅ Select **"Read and write permissions"** (required for deployments)
   - ✅ Check **"Allow GitHub Actions to create and approve pull requests"**

3. **Click "Save"** (if there's a save button)

---

## STEP 4: Verify Setup is Complete

### Check 1: Verify Vercel Project
```bash
cd /Users/mithunselvan/dokuwiki
cat nextjs-wiki/.vercel/project.json
# Should output:
# {"projectId":"prj_CwyWDXzKa9...","orgId":"team_tH98...","projectName":"nextjs-wiki"}
```

### Check 2: Verify GitHub Secrets Set
Go to: https://github.com/mithunselvan/dokuwiki/settings/secrets/actions
- Should see three secrets listed (values are hidden):
  - ✅ VERCEL_TOKEN
  - ✅ VERCEL_ORG_ID
  - ✅ VERCEL_PROJECT_ID

### Check 3: Verify GitHub Workflows
Go to: https://github.com/mithunselvan/dokuwiki/actions
- Should see workflow files:
  - ✅ Deploy to Vercel (deploy.yml)
  - ✅ Test (test.yml)

### Check 4: Verify GitHub Actions Permissions
Go to: https://github.com/mithunselvan/dokuwiki/settings/actions/permissions
- ✅ "Read and write permissions" selected
- ✅ PR creation allowed

---

## STEP 5: First Test Deployment

### Create Feature Branch
```bash
cd /Users/mithunselvan/dokuwiki
git checkout -b test/github-actions-setup
```

### Make Minor Change
```bash
# Add a test comment
echo "<!-- GitHub Actions test deployment -->" >> nextjs-wiki/content/home.mdx
```

### Commit and Push
```bash
git add nextjs-wiki/content/home.mdx
git commit -m "test: verify GitHub Actions deployment pipeline

This is a test deployment to verify:
- GitHub Actions workflows are working
- Vercel secrets are configured correctly
- Build and deploy processes function end-to-end"

git push origin test/github-actions-setup
```

### Create Pull Request
Go to: https://github.com/mithunselvan/dokuwiki/pulls
- Click "New Pull Request"
- Compare: `main` ← `test/github-actions-setup`
- Click "Create Pull Request"
- Add title: "Test: GitHub Actions Setup Verification"
- Click "Create Pull Request"

### Watch Workflow Run
Go to: https://github.com/mithunselvan/dokuwiki/actions

**Expected Steps:**
1. "Test" workflow starts immediately (on any branch)
   - ✅ Checkout code
   - ✅ Setup Node.js 20
   - ✅ npm ci (install dependencies)
   - ✅ npm run type-check
   - ✅ npm run lint
   - ✅ npm run build
   - Result: Green checkmark ✅

2. "Deploy to Vercel" workflow starts
   - ✅ build-and-test job (same as above)
   - ✅ deploy-preview job (should show preview URL)
   - Result: Preview deployment URL in PR

### Check Preview URL
- The PR should show a comment with deployment preview link
- Click link to verify temporary preview URL works
- Check that changes appear on preview

### Merge PR if Successful
Once preview deployment works:
1. Go back to PR
2. Click "Merge pull request" (or "Squash and merge")
3. Confirm merge to main

### Watch Production Deployment
Go to: https://github.com/mithunselvan/dokuwiki/actions
- "Deploy to Vercel" workflow runs again with main branch
- watch for deploy-production job
- Should complete in ~2-3 minutes
- Check https://sysya.com.au to verify live deployment

---

## STEP 6: Verify Live Deployment

```bash
# Check if deployment is active
curl -s https://sysya.com.au | grep "Field Recording" | head -1

# Or open in browser
open https://sysya.com.au

# Verify DNS is correct
dig sysya.com.au +short
# Should return Vercel IP or CNAME to Vercel
```

---

## EXTRACTED IDs FOR REFERENCE

```
VERCEL_ORG_ID: team_tH98VMoS7j13qpHorLOYHU0h
VERCEL_PROJECT_ID: prj_CwyWDXzKa9IHDpBIUoguOU3V4OgX
```

---

## TROUBLESHOOTING

### Issue: Workflow says "Error: Unauthorized"

**Solution:**
- Check VERCEL_TOKEN is set correctly in GitHub Secrets
- Verify token hasn't expired
- Create new token and update secret

### Issue: "Error: Resource not accessible by integration"

**Solution:**
- Go to Settings → Actions → Permissions
- Ensure "Read and write permissions" is selected
- Re-run workflow

### Issue: Build succeeds but deploy fails

**Solution:**
- Check Vercel project name is correct: `nextjs-wiki`
- Verify VERCEL_ORG_ID and VERCEL_PROJECT_ID match .vercel/project.json
- Check Vercel project dashboard for any issues

### Issue: Preview URL doesn't appear in PR

**Solution:**
- Check GitHub Actions log for deploy-preview job errors
- Verify Vercel credentials in GitHub Secrets
- Try re-running failed jobs

---

## NEXT STEPS

After successful test deployment:

1. **Monitor production**: Visit https://sysya.com.au
2. **Update DNS nameservers** (if using Route53):
   ```bash
   ./scripts/update-dns.sh
   ```
3. **Decommission old AWS infrastructure**:
   ```bash
   ./scripts/tf-force-destroy.sh  # Only after production verified
   ```
4. **Set calendar reminders**:
   - 90 days from now: Rotate Vercel token
   - 30 days from token creation: Review token expiration

---

## DEPLOYMENT STATUS

| Task | Status | Time |
|------|--------|------|
| Vercel Project Setup | ✅ Done | - |
| Extract IDs | ✅ Done | - |
| Create Personal Token | ⏳ Manual | 2 min |
| Set GitHub Secrets | ⏳ Manual | 5 min |
| Configure Permissions | ⏳ Manual | 2 min |
| Test Deployment | ⏳ Manual | 5 min |
| **TOTAL** | | **~15 min** |

---

## KEY DASHBOARDS TO BOOKMARK

| Name | URL | Purpose |
|------|-----|---------|
| GitHub Actions | https://github.com/mithunselvan/dokuwiki/actions | Monitor workflow runs |
| GitHub Secrets | https://github.com/mithunselvan/dokuwiki/settings/secrets/actions | Manage credentials |
| Vercel Dashboard | https://vercel.com/dashboard/projects/nextjs-wiki | Monitor deployments |
| Vercel Tokens | https://vercel.com/account/tokens | Manage auth tokens |
| Production | https://sysya.com.au | Verify live site |

---

## SECURITY REMINDERS

✅ **DO:**
- Use GitHub Secrets for all sensitive values
- Rotate tokens every 90 days
- Keep backup of token creation date
- Use strong, randomly generated tokens

❌ **DON'T:**
- Paste tokens in chat or messages
- Commit tokens to git
- Share personal access tokens
- Use tokens in logged output

---

## SUMMARY

This guide provides step-by-step instructions to:
1. Create a Vercel Personal Access Token (manual)
2. Configure GitHub Secrets (via web UI)
3. Set GitHub Actions Permissions
4. Test deployment workflow
5. Verify production deployment

All steps are manual due to browser-based OAuth requirements, but the setup is straightforward and one-time only.

**Estimated Time: 15-20 minutes**
