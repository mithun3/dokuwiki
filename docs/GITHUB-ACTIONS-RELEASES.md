# 🤖 GitHub Actions - Automated Release Workflow

Automated versioning and release creation via GitHub Actions.

---

## Overview

Two GitHub Actions workflows automate the release process:

1. **release.yml** - Creates releases (version tag, CHANGELOG, GitHub release)
2. **validate-version.yml** - Validates version consistency in PRs

**Result:** UI-driven releases in 30 seconds instead of 5 minutes of manual git commands.

---

## How to Use (Quick Start)

### 1. Trigger Release Workflow

Go to GitHub:
```
https://github.com/mithun3/dokuwiki/actions
```

Or navigate:
- Repository → Actions tab
- Left sidebar → "Create Release"
- Click "Run workflow"

### 2. Fill In Release Details

```
Version:          1.3.0
Branch:           migrate (or main)
Changelog Entry:  Temporal tracking added with ArticleFooter
```

### 3. Click "Run"

The workflow will:
- ✅ Validate version format
- ✅ Check version doesn't already exist
- ✅ Update CHANGELOG.md
- ✅ Update package.json
- ✅ Commit changes
- ✅ Create git tag
- ✅ Push to remote
- ✅ Create GitHub release
- ✅ Show success summary

**Done!** All in ~30 seconds.

---

## Workflow Details

### release.yml

**What it does:**
1. Validates version format (X.Y.Z)
2. Checks version doesn't exist
3. Updates CHANGELOG.md with new entry
4. Updates nextjs-wiki/package.json
5. Commits both files
6. Creates annotated git tag
7. Pushes to remote
8. Creates GitHub release
9. Shows summary

**Inputs:**
- **version** - Version number (e.g., 1.3.0)
- **release_branch** - Which branch to tag (main or migrate)
- **changelog_entry** - What changed in this release

**Example inputs:**
```
Version:          1.3.0
Branch:           migrate
Changelog Entry:  Added ArticleFooter temporal tracking with evolution phases
```

**Output:**
```
✅ RELEASE CREATED SUCCESSFULLY

Version:         v1.3.0
Branch:          migrate
Date:            2026-02-15
GitHub Release:  https://github.com/mithun3/dokuwiki/releases/tag/v1.3.0

Changes:
Added ArticleFooter temporal tracking with evolution phases
```

### validate-version.yml

**When it runs:**
- On every PR that modifies CHANGELOG.md or package.json

**What it checks:**
1. Version format is valid (X.Y.Z)
2. CHANGELOG.md and package.json have same version
3. CHANGELOG.md header format is correct
4. Semantic Versioning rules followed

**Auto-fails PR if:**
- Versions don't match
- Format is invalid
- CHANGELOG format wrong

---

## Example Release Workflow

### Scenario: Release v1.3.0

**Before (Manual):**
```bash
# 1. Edit CHANGELOG.md
# 2. Edit package.json
git add CHANGELOG.md nextjs-wiki/package.json
git commit -m "chore: release v1.3.0"
git tag -a v1.3.0 -m "Release v1.3.0 - ..."
git push origin migrate --tags
# Total: 5 minutes
```

**After (Automated):**
```
1. Go to GitHub Actions
2. Click "Create Release"
3. Enter:
   - Version: 1.3.0
   - Branch: migrate
   - Changes: Added temporal tracking
4. Click "Run"
# Total: 30 seconds
```

---

## Features

### ✅ Automatic Updates
- CHANGELOG.md updated automatically
- package.json version bumped
- Git tag created
- GitHub release published

### ✅ Validation
- Version format checked (X.Y.Z)
- Duplicate version detection
- PR validation for consistency
- Semantic versioning enforced

### ✅ Safety
- Fails if version exists
- Fails if format invalid
- Fails on version mismatch (PR)
- Clear error messages

### ✅ Transparency
- Shows what changed
- Displays summary
- Links to GitHub release
- Updates all files

---

## Step-by-Step: Create Your First Automated Release

### 1. Navigate to Actions

```
GitHub → Repository → Actions tab → "Create Release"
```

### 2. Click "Run Workflow"

Green button in top right of workflow list.

### 3. Fill Form

```
Version:          1.3.0
Release Branch:   migrate
Changelog Entry:  Added new features and bug fixes
```

### 4. Review & Run

- Click dropdown arrow to expand form
- Review entries
- Click "Run workflow"

### 5. Monitor

Watch the workflow execute:
- ✅ Checkout
- ✅ Configure Git
- ✅ Validate Version
- ✅ Update CHANGELOG
- ✅ Update package.json
- ✅ Commit
- ✅ Create Tag
- ✅ Push
- ✅ Create Release
- ✅ Success

### 6. Verify

```
GitHub Releases:
https://github.com/mithun3/dokuwiki/releases/tag/v1.3.0
```

---

## Handling Errors

### Error: "Invalid version format"

**Cause:** Version not in X.Y.Z format

**Fix:**
```
❌ Wrong:  1.3, 1, 1.3.0.1, 1-3-0
✅ Right:  1.3.0, 2.0.0, 1.0.1
```

### Error: "Tag already exists"

**Cause:** Version already released

**Fix:**
- Use different version number
- Or delete old tag:
```bash
git tag -d v1.3.0
git push origin --delete v1.3.0
```

### Error: "Version mismatch" (PR)

**Cause:** package.json and CHANGELOG.md have different versions

**Fix:**
- Update both to same version
- Match format: [X.Y.Z] - YYYY-MM-DD in CHANGELOG

---

## Reference: Workflow Inputs

### version
- **Required:** Yes
- **Type:** String
- **Format:** X.Y.Z (e.g., 1.3.0)
- **Validation:** Auto-checked

### release_branch
- **Required:** Yes
- **Type:** Choice (main or migrate)
- **Default:** migrate
- **Note:** Determines which branch gets tagged

### changelog_entry
- **Required:** Yes
- **Type:** String
- **Example:** "Added temporal tracking and ArticleFooter component"
- **Note:** Can be multi-line using `\n`

---

## Workflow Files

### Location: `.github/workflows/`

```
.github/workflows/
├── release.yml           (✅ Create releases)
└── validate-version.yml  (✅ Validate in PRs)
```

### release.yml Structure
```yaml
name: Create Release
on:
  workflow_dispatch:        # Manual trigger
    inputs:
      version:              # Version number
      release_branch:       # Which branch
      changelog_entry:      # What changed
jobs:
  create-release:           # Single job
    steps:                  # 9 steps total
```

### validate-version.yml Structure
```yaml
name: Validate Version
on:
  pull_request:             # Auto-trigger on PRs
    paths:                  # When these files change
      - CHANGELOG.md
      - package.json
jobs:
  validate-version:         # Single job
    steps:                  # 4 validation steps
```

---

## What Gets Updated

### CHANGELOG.md
```markdown
## [1.3.0] - 2026-02-15      ← Auto-generated header
                             
### Changes                  ← Auto-added
- Added temporal tracking... ← Your entry
```

### package.json
```json
{
  "version": "1.3.0"         ← Auto-updated
}
```

### Git Tag
```
Tag: v1.3.0
Message: Release v1.3.0 - [full details]
```

### GitHub Release
```
Release: Release v1.3.0
Tag: v1.3.0
Notes: [auto-generated from tag message]
```

---

## Best Practices

✅ **DO:**
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Write clear changelog entries
- Tag from `migrate` branch (not `main`)
- Verify release on GitHub after creation
- Use for actual releases only

❌ **DON'T:**
- Tag experimental code
- Skip changelog entries
- Reuse version numbers
- Tag from random branches
- Use for every commit

---

## Comparing Manual vs Automated

| Step | Manual | Automated |
|------|--------|-----------|
| Edit CHANGELOG | Manual | Auto ✅ |
| Edit package.json | Manual | Auto ✅ |
| Git commit | Manual | Auto ✅ |
| Git tag | Manual | Auto ✅ |
| Git push | Manual | Auto ✅ |
| GitHub release | Manual | Auto ✅ |
| **Total time** | **5 min** | **30 sec** ✅ |

---

## FAQ

### Q: Can I undo a release?
A: Yes, delete the tag:
```bash
git tag -d v1.3.0
git push origin --delete v1.3.0
```
Then delete GitHub release via UI.

### Q: Do I need to clone locally?
A: No! Everything runs on GitHub servers. Just use the UI.

### Q: What if workflow fails?
A: Check the workflow logs:
```
GitHub → Actions → Create Release → [workflow run]
```
Look for error messages and fix inputs.

### Q: Can I modify the workflow?
A: Yes! Edit `.github/workflows/release.yml` directly in GitHub UI or locally.

### Q: Does this replace VERSIONING.md?
A: No! VERSIONING.md documents the strategy. Workflows automate the execution.

### Q: Can I use with main branch?
A: Yes! Select `main` in release_branch input. Workflows support both branches.

---

## Workflow Security

✅ **What's secure:**
- Runs on GitHub servers (isolated)
- Uses GITHUB_TOKEN (auto-managed)
- No credentials hardcoded
- No external dependencies

✅ **Permissions required:**
- `contents: write` (create tags/releases)
- Standard GitHub Actions token

✅ **Access:**
- Only users with `Write` access can trigger
- Org members or repository collaborators

---

## Monitoring

### View Workflow Status
```
GitHub → Actions → Create Release
```

Shows:
- ✅ Successful runs (green)
- ❌ Failed runs (red)
- ⏳ In-progress (yellow)
- Execution time
- Logs for each step

### View Releases Created
```
GitHub → Releases
```

Shows all automated and manual releases with:
- Version number
- Release date
- Download links
- Release notes

---

## Next Steps

1. **Try it:** Create your first release via Actions
2. **Test:** Verify tag and release on GitHub
3. **Share:** Tell team about automation
4. **Monitor:** Use workflow summary to track releases
5. **Improve:** Customize workflow if needed

---

## Related Documentation

- [VERSIONING.md](../VERSIONING.md) - Versioning strategy
- [CHANGELOG.md](../CHANGELOG.md) - Release history
- [release.yml](.github/workflows/release.yml) - Release workflow code
- [validate-version.yml](.github/workflows/validate-version.yml) - Validation workflow code

---

**Created:** January 27, 2026  
**Status:** ✅ Ready to Use  
**Activation:** Automatic (workflows activate when pushed)  
**Trigger:** Manual via GitHub Actions UI
