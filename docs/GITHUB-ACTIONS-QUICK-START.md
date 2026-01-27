# 🚀 GitHub Actions Release - Quick Start

Create automated releases in 30 seconds instead of 5 minutes of git commands.

---

## One-Time Setup (Already Done)

✅ Workflow files created:
- `.github/workflows/release.yml` - Create releases
- `.github/workflows/validate-version.yml` - Validate versions

**Nothing more to set up!** Workflows auto-activate when pushed.

---

## Create Your First Automated Release

### Step 1: Go to GitHub Actions

```
https://github.com/mithun3/dokuwiki/actions
```

Or:
1. Open repository on GitHub
2. Click "Actions" tab
3. Find "Create Release" in sidebar

### Step 2: Click "Run Workflow"

Look for green button at top right of "Create Release" workflow.

### Step 3: Fill In Details

A form will appear with three fields:

```
┌─────────────────────────────────────┐
│ Create Release Workflow             │
├─────────────────────────────────────┤
│                                     │
│ Version: [1.3.0        ]            │
│ Release Branch: [main ▼]            │
│ Changelog Entry: [Added temporal..] │
│                                     │
│              [Run Workflow]         │
│                                     │
└─────────────────────────────────────┘
```

**Example values:**
- **Version:** `1.3.0`
- **Branch:** `migrate`
- **Entry:** `Added temporal tracking with ArticleFooter`

### Step 4: Click "Run Workflow"

Green button at bottom of form.

### Step 5: Wait for Completion

Watch workflow execute (takes 30-60 seconds):
```
✅ Checkout
✅ Configure Git
✅ Validate Version Format
✅ Check Version Doesn't Exist
✅ Update CHANGELOG.md
✅ Update package.json Version
✅ Commit Changes
✅ Create Git Tag
✅ Push Changes and Tags
✅ Create GitHub Release
✅ Success Summary
```

### Step 6: Verify Release Created

Check GitHub Releases page:
```
https://github.com/mithun3/dokuwiki/releases
```

Should show your new release with tag, date, and changelog entry.

---

## That's It! 🎉

Your release is now:
- ✅ Tagged in git (`v1.3.0`)
- ✅ Committed (`chore: release v1.3.0`)
- ✅ Documented (CHANGELOG.md updated)
- ✅ Published (GitHub release created)
- ✅ Accessible (https://github.com/.../releases/tag/v1.3.0)

---

## Common Scenarios

### Scenario 1: Release to migrate branch

```
Version:        1.3.0
Branch:         migrate
Entry:          Added temporal tracking features
```

### Scenario 2: Release to main branch

```
Version:        1.3.0
Branch:         main
Entry:          Added temporal tracking features
```

### Scenario 3: Patch release

```
Version:        1.2.1
Branch:         migrate
Entry:          Fixed duplicate code exports
```

### Scenario 4: Major release

```
Version:        2.0.0
Branch:         migrate
Entry:          AWS infrastructure decommissioning complete, full serverless
```

---

## What the Workflow Does

### Automatically
1. Validates version format (X.Y.Z)
2. Checks version doesn't already exist
3. Updates CHANGELOG.md with your entry
4. Updates package.json to new version
5. Commits both files
6. Creates git tag
7. Pushes to remote
8. Creates GitHub release page
9. Shows success summary

### You Provide
1. Version number
2. Target branch
3. Changelog description

### Result
A complete release in seconds with:
- Git tag: `v1.3.0`
- Commit: `chore: release v1.3.0`
- CHANGELOG entry: Your description
- GitHub release: Auto-generated page

---

## Troubleshooting

### ❌ "Invalid version format"

Make sure version is: `MAJOR.MINOR.PATCH`

```
❌ Wrong:   1.3, v1.3.0, 1, 1-3-0
✅ Right:   1.3.0, 2.0.0, 1.0.1
```

### ❌ "Tag already exists"

Version already released. Use a new one:
```
Already have: v1.3.0
Use instead:  v1.3.1 (patch)
Or:           v1.4.0 (minor)
```

### ❌ Workflow didn't run

Try again:
1. Refresh page (F5)
2. Click "Run workflow" button
3. If not visible, check branch is correct

### ✅ Workflow succeeded but GitHub release not showing

Refresh releases page:
```
https://github.com/mithun3/dokuwiki/releases
```

(May take a few seconds to appear)

---

## Pro Tips

💡 **Tip 1: Multi-line changelog entries**

You can use line breaks:
```
Added:
- Temporal tracking system
- ArticleFooter component
- Evolution phases (foundational/refined/experimental/archived)
```

💡 **Tip 2: Reference issues/PRs**

```
Fixed issues #123 and #124
Closes #125

- Added temporal tracking
- Fixed article footer rendering
```

💡 **Tip 3: Link to documentation**

```
See GITHUB-ACTIONS-RELEASES.md for details

- Automated release workflow implemented
- 30-second releases (down from 5 minutes)
```

💡 **Tip 4: Schedule releases regularly**

Create releases on:
- Weekly (every Friday)
- Monthly (end of month)
- Per-milestone (v1.x complete, v2.x starting)

---

## Before & After

### Before (Manual)
```
5-10 minutes of git commands:
├─ Edit CHANGELOG.md
├─ Edit package.json
├─ git add / git commit
├─ git tag -a v1.3.0 -m "..."
├─ git push origin migrate
└─ git push origin --tags
```

### After (Automated)
```
30 seconds via UI:
├─ Open GitHub Actions
├─ Click "Run workflow"
├─ Enter version, branch, message
├─ Click "Run"
└─ ✅ Done!
```

**Savings: 4-9.5 minutes per release**

---

## Next Release Walk-Through

When you're ready to release v1.3.0:

1. **Go to Actions tab**
   ```
   GitHub.com → dokuwiki → Actions
   ```

2. **Find "Create Release"**
   Left sidebar should show it

3. **Click "Run workflow"**
   Green button

4. **Enter details**
   ```
   Version:          1.3.0
   Release Branch:   migrate
   Changelog Entry:  Added new features and improvements
   ```

5. **Click "Run workflow"**
   Green button at bottom

6. **Wait ~60 seconds**
   Watch steps execute

7. **Check GitHub Releases**
   ```
   GitHub.com → dokuwiki → Releases
   ```
   Your v1.3.0 release is there!

---

## File Reference

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | Creates releases automatically |
| `.github/workflows/validate-version.yml` | Validates PRs that modify versions |
| `CHANGELOG.md` | Updated automatically with each release |
| `nextjs-wiki/package.json` | Version updated automatically |

---

## Documentation Links

- Full guide: [GITHUB-ACTIONS-RELEASES.md](GITHUB-ACTIONS-RELEASES.md)
- Versioning strategy: [VERSIONING.md](VERSIONING.md)
- Release history: [CHANGELOG.md](CHANGELOG.md)
- Manual release: [VERSIONING-IMPLEMENTATION-READY.md](VERSIONING-IMPLEMENTATION-READY.md)

---

## Summary

✅ **Setup required:** None (already done)  
✅ **Time per release:** 30 seconds (down from 5 min)  
✅ **Manual effort:** Just fill form + click  
✅ **Automation:** Everything else handled  
✅ **Safety:** Validation prevents errors  

**You're all set! Create your next release in the Actions tab.** 🚀
