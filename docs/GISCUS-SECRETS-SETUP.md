# Setting Up Giscus Secrets

Your Giscus configuration IDs have been moved from hardcoded values to **GitHub Secrets** for improved security.

## 🔐 What Changed

**Before (Hardcoded in git):**
```typescript
// ❌ NOT SECURE - visible in git history
script.dataset.repoId = 'R_kgDOQ6N5_A';
script.dataset.categoryId = 'DIC_kwDOQ6N5_M4C1ciQ';
```

**After (Environment variables from secrets):**
```typescript
// ✅ SECURE - loaded from GitHub Secrets at build time
script.dataset.repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || '';
script.dataset.categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '';
```

---

## 📋 Step 1: Set GitHub Secrets

Visit: https://github.com/mithun3/dokuwiki/settings/secrets/actions

Create 2 new secrets:

### Secret 1: GISCUS_REPO_ID
- **Name:** `GISCUS_REPO_ID`
- **Value:** `R_kgDOQ6N5_A`
- Click "Add secret"

### Secret 2: GISCUS_CATEGORY_ID
- **Name:** `GISCUS_CATEGORY_ID`
- **Value:** `DIC_kwDOQ6N5_M4C1ciQ`
- Click "Add secret"

### Verify
```bash
gh secret list
# Output should show:
# GISCUS_REPO_ID
# GISCUS_CATEGORY_ID
# (plus existing secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
```

---

## 💻 Step 2: Set Up Local Development

Create a `.env.local` file in `nextjs-wiki/` directory:

```bash
cd nextjs-wiki
cat > .env.local << 'EOF'
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDOQ6N5_A
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOQ6N5_M4C1ciQ
EOF
```

Or copy from example:
```bash
cp .env.example .env.local
# Then edit .env.local with your actual values
```

**Important:** `.env.local` is in `.gitignore` and won't be committed. This is intentional.

---

## 🔄 How It Works

### During Local Development
1. You create `.env.local` with Giscus IDs
2. Next.js reads `.env.local` during `npm run dev`
3. Environment variables are available to components
4. Comments component loads with correct IDs

### During GitHub Actions Deployment
1. Workflow reads secrets from GitHub
2. Sets `NEXT_PUBLIC_GISCUS_REPO_ID` environment variable
3. Next.js uses it during build (`.github/workflows/deploy.yml`)
4. Built output includes correct IDs
5. Vercel receives built files with IDs baked in

### Deployment Flow
```
GitHub Secrets
     ↓
Deploy workflow sets env vars
     ↓
Next.js build with env vars
     ↓
Comments.tsx gets values from process.env
     ↓
Vercel receives built site
     ↓
Users see working comments
```

---

## 🧪 Testing

### Local Testing
```bash
cd nextjs-wiki

# Build with env vars to verify
NEXT_PUBLIC_GISCUS_REPO_ID='R_kgDOQ6N5_A' \
NEXT_PUBLIC_GISCUS_CATEGORY_ID='DIC_kwDOQ6N5_M4C1ciQ' \
npm run build

# Run dev server
npm run dev
# Visit http://localhost:3000/recording
# Comments section should load
```

### Production Testing
1. Ensure GitHub Secrets are set
2. Push to `migrate` branch
3. GitHub Actions workflow runs
4. Vercel deployment happens
5. Visit https://sysya.com.au
6. Check comments section loads correctly

---

## 🔍 Troubleshooting

### "Comments section not loading"

**Check 1: Verify secrets are set**
```bash
gh secret list | grep GISCUS
# Should show both GISCUS_REPO_ID and GISCUS_CATEGORY_ID
```

**Check 2: Verify local .env.local**
```bash
cat nextjs-wiki/.env.local
# Should have both values
```

**Check 3: Check build logs**
```bash
npm run build
# Look for "Generating static pages" - should complete successfully
```

**Check 4: Browser console**
- Open DevTools (F12)
- Go to Console tab
- Look for Giscus loading errors
- Check if env vars are undefined

### "Build fails with missing env vars"

**Solution:**
```bash
# For local dev
cp nextjs-wiki/.env.example nextjs-wiki/.env.local
# Edit with your values

# For GitHub Actions
# Ensure GISCUS_REPO_ID and GISCUS_CATEGORY_ID are in secrets
gh secret list
```

### "Comments work locally but not in production"

**Check:**
1. GitHub Secrets are set: https://github.com/mithun3/dokuwiki/settings/secrets/actions
2. `.github/workflows/deploy.yml` includes Giscus env vars (check lines 14-17)
3. Vercel environment variables are NOT set (use GitHub secrets only)
4. Force rebuild on Vercel dashboard

---

## 🎯 Security Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Visible in git** | ❌ Yes (hardcoded) | ✅ No |
| **In git history** | ❌ Yes (search visible) | ✅ No |
| **Requires git cleanup** | ❌ Yes (BFG) | ✅ No |
| **Centrally managed** | ❌ No (copies in code) | ✅ Yes (one place) |
| **Easy to rotate** | ❌ No (edit code) | ✅ Yes (edit secret) |
| **Visible in source** | ❌ Yes (repo search) | ✅ No |

---

## 📚 Files Modified

| File | Changes |
|------|---------|
| `nextjs-wiki/src/components/Comments.tsx` | Use `process.env.NEXT_PUBLIC_GISCUS_REPO_ID` and `process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID` |
| `nextjs-wiki/.env.example` | Template for local development |
| `.github/workflows/deploy.yml` | Pass Giscus secrets to build environment |
| `nextjs-wiki/.gitignore` | Already ignores `.env.local` ✅ |

---

## ✅ Checklist

- [ ] Set `GISCUS_REPO_ID` in GitHub Secrets
- [ ] Set `GISCUS_CATEGORY_ID` in GitHub Secrets
- [ ] Create `nextjs-wiki/.env.local` for local development
- [ ] Test local build: `npm run build`
- [ ] Test local dev: `npm run dev`
- [ ] Verify comments load on http://localhost:3000/recording
- [ ] Push to `migrate` branch
- [ ] Monitor GitHub Actions workflow
- [ ] Verify Vercel deployment
- [ ] Check production: https://sysya.com.au

---

## 🔗 Related Documentation

- [Giscus Setup Guide](../GISCUS-SETUP.md)
- [Comments Architecture](../docs/COMMENTS-ARCHITECTURE.md)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
