# Giscus Comments Setup Guide

This wiki now includes **Giscus-powered comments** on every page. Giscus is a lightweight, privacy-first commenting system powered by GitHub Discussions.

## What You Need to Do

### 1. Enable GitHub Discussions (One-time)

1. Go to your repository: https://github.com/mithun3/dokuwiki
2. Click **Settings** → scroll down to **Features**
3. Check the **Discussions** checkbox
4. Click **Set up discussions**

### 2. Get Your Repository and Category IDs

After enabling Discussions, you need to get two IDs for Giscus configuration:

#### Option A: Using GitHub CLI (Easiest)
```bash
# Get repo ID
gh api repos/mithun3/dokuwiki --json id

# Get discussion category ID
gh api repos/mithun3/dokuwiki/discussions/categories --json
```

#### Option B: Using the Giscus Configuration Tool
1. Visit: https://giscus.app
2. Enter your repository: `mithun3/dokuwiki`
3. Select the category: `Comments`
4. Giscus will show you the configuration with repo ID and category ID

### 3. Update Comments Component

Update these two lines in `nextjs-wiki/src/components/Comments.tsx`:

```typescript
script.dataset.repoId = 'R_YOUR_REPO_ID'; // Replace with actual repo ID
script.dataset.categoryId = 'DIC_YOUR_CATEGORY_ID'; // Replace with actual category ID
```

**Example values:**
```typescript
script.dataset.repoId = 'R_kgDOH1F4rQ';
script.dataset.categoryId = 'DIC_kwDOH1F4rc4CfQ1l';
```

### 4. Test Locally (Optional)

```bash
cd nextjs-wiki
npm run build
npm run start
```

Visit http://localhost:3000/about and scroll to the bottom. You should see the comments section.

### 5. Deploy to Production

Once configured:
```bash
git add nextjs-wiki/src/components/Comments.tsx
git commit -m "config: update giscus repo and category IDs"
git push origin migrate
# Then merge to main for production deployment
```

## What's Already Set Up

✅ **Comments Component** (`src/components/Comments.tsx`)
- Lightweight, privacy-focused Giscus integration
- Auto-loads comments from GitHub Discussions
- Supports reactions and nested replies

✅ **Contact Page Updated** (`content/contact.mdx`)
- Explains how to use comments on each page
- Clarifies when to use comments vs email vs GitHub Issues

✅ **Comments on All Pages**
- Comments section added to every wiki page
- Uses pathname mapping (clean URLs)
- Lazy-loads for performance

✅ **Automatic Backup Workflow** (`.github/workflows/backup-discussions.yml`)
- Runs weekly (Monday at 00:00 UTC)
- Exports all discussions + comments to JSON
- Commits backups to `backups/discussions/` directory
- Provides permanent, version-controlled archive

✅ **Manual Backup Script** (`scripts/backup-discussions.sh`)
- Run anytime: `./scripts/backup-discussions.sh`
- Requires GitHub CLI: `brew install gh`

## How Comments Work

1. **First Visit**: User sees comment section at bottom of any page
2. **User Clicks**: Giscus iframe loads GitHub Discussions UI
3. **User Signs In**: GitHub login required (privacy benefit)
4. **User Comments**: Comment posted to GitHub Discussion thread
5. **Backup Runs**: Weekly action exports all discussions to JSON files
6. **Data Persists**: Comments live in GitHub indefinitely

## Backup Strategy

### Automatic Backup (GitHub Actions)
- **Frequency**: Every Monday at midnight UTC
- **Location**: `backups/discussions/discussions-YYYYMMDD_HHMMSS.json`
- **Trigger**: Manual trigger available via `workflow_dispatch`

### Manual Backup
```bash
# Requires GitHub CLI
./scripts/backup-discussions.sh
```

### Data Recovery
All backup files are JSON format:
```json
{
  "data": {
    "repository": {
      "discussions": {
        "nodes": [
          {
            "title": "Page Title",
            "body": "Discussion content",
            "comments": [...]
          }
        ]
      }
    }
  }
}
```

## Privacy & Data

- ✅ **No tracking**: Giscus doesn't track users
- ✅ **No ads**: Zero advertisements
- ✅ **Data ownership**: All comments stored in your GitHub repo
- ✅ **User choice**: Users decide whether to comment (GitHub account required)
- ✅ **Export anytime**: All discussion data is exportable as JSON

## Troubleshooting

### Comments not showing?
1. Verify GitHub Discussions is enabled in repo settings
2. Check that `repoId` and `categoryId` are correct in `Comments.tsx`
3. Ensure category named "Comments" exists in Discussions settings
4. Check browser console for errors (F12 → Console)

### Giscus configuration tool not working?
- Visit: https://giscus.app/en
- Use the form to verify your repo/category setup

### Backup script fails?
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Run backup manually
./scripts/backup-discussions.sh
```

## Next Steps

1. ✅ Enable GitHub Discussions in repo settings
2. ✅ Get your repo and category IDs
3. ✅ Update `Comments.tsx` with your IDs
4. ✅ Deploy to production
5. ✅ Test by commenting on a page
6. ✅ Monitor weekly backups

## Questions?

- **Giscus Docs**: https://giscus.app
- **GitHub Discussions**: https://docs.github.com/en/discussions
- **This Project**: Use comments on any page or email mithun@sysya.com.au
