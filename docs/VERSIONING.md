# Versioning Strategy

sysya-wiki uses **Simple Semantic Versioning** with git tags and changelog automation.

## Overview

- **Format:** `v<MAJOR>.<MINOR>.<PATCH>`
- **Single Source of Truth:** Git tags
- **Change Log:** [CHANGELOG.md](CHANGELOG.md)
- **Package Metadata:** [nextjs-wiki/package.json](nextjs-wiki/package.json)

---

## Semantic Versioning Explained

### MAJOR Version - Breaking Changes
- Infrastructure migrations
- Deployment platform changes
- URL structure changes
- Major feature removals

**Example:** `v2.0.0` - AWS infrastructure decommissioned, Vercel-only

### MINOR Version - New Features
- New components or functionality
- Content system enhancements
- Temporal tracking additions
- Comments system updates

**Example:** `v1.1.0` - Article temporal tracking added

### PATCH Version - Bug Fixes
- Code quality improvements
- Performance optimizations
- Dependency updates
- Documentation corrections

**Example:** `v1.0.1` - Fixed duplicate code exports

---

## Current Versions

| Version | Release Date | Status | Focus |
|---------|--------------|--------|-------|
| **v1.0.0** | 2026-01-27 | ✅ Current | Next.js migration complete |
| **v1.1.0** | 2026-01-27 | ✅ Released | Temporal tracking added |
| **v1.2.0** | 2026-01-27 | ✅ Released | Decommissioning automation |
| **v2.0.0** | 2026-02-TBD | ⏳ Planned | AWS decommissioning |

---

## How to Create a New Release

### 1. Update CHANGELOG.md

Add new version entry at the top:

```markdown
## [1.3.0] - 2026-02-10

### Added
- Feature description
- Another feature

### Fixed
- Bug fix description

### Changed
- Breaking change (if any)
```

### 2. Update package.json Version

Edit `nextjs-wiki/package.json`:

```json
{
  "version": "1.3.0",
  "description": "Description of what changed"
}
```

### 3. Commit Changes

```bash
git add CHANGELOG.md nextjs-wiki/package.json
git commit -m "chore: release v1.3.0

- Feature 1 description
- Feature 2 description
- Bug fix description"
```

### 4. Create Git Tag

```bash
# Annotated tag (recommended)
git tag -a v1.3.0 -m "Release v1.3.0 - Description of major changes"

# Or lightweight tag
git tag v1.3.0
```

### 5. Push to Remote

```bash
# Push commits
git push origin migrate

# Push tags
git push origin --tags
```

### 6. Verify

```bash
# List all tags
git tag -l

# Show specific tag
git show v1.3.0
```

---

## Git Tag Commands Reference

### Create Tags
```bash
# Annotated tag (recommended - includes metadata)
git tag -a v1.0.0 -m "Release v1.0.0 - Migration complete"

# Lightweight tag
git tag v1.0.0

# Tag from previous commit
git tag -a v1.0.0 abc1234 -m "Release v1.0.0"
```

### List Tags
```bash
# Show all tags
git tag

# Show tags matching pattern
git tag -l "v1.*"

# Show tag with details
git show v1.0.0
```

### Manage Tags
```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0

# Rename tag (delete old, create new)
git tag -a v1.0.1 v1.0.0^{}
git tag -d v1.0.0
git push origin --delete v1.0.0
git push origin --tags
```

### View History
```bash
# See commits since last tag
git log v1.0.0..HEAD --oneline

# See tags in log
git log --oneline --decorate

# Find tag for commit
git describe --tags abc1234
```

---

## Changelog Management

### Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
## [1.3.0] - 2026-02-10

### Added
- New features go here

### Changed
- Breaking changes go here

### Fixed
- Bug fixes go here

### Removed
- Deprecated features go here

### Security
- Security patches go here
```

### Categories

- **Added** - New features or functionality
- **Changed** - Breaking changes or modifications
- **Fixed** - Bug fixes and corrections
- **Removed** - Deprecated or deleted features
- **Security** - Security patches
- **Deprecated** - Features being phased out

### Examples

✅ **Good entry:**
```
- Fixed duplicate code exports in store.ts (227 lines removed)
- Added ArticleFooter component with evolution phase tracking
- Updated decommissioning scripts with safety gates
```

❌ **Poor entry:**
```
- Fixed stuff
- Added things
- Updated code
```

---

## Release Checklist

Before creating a release:

- [ ] All tests passing (38/38)
- [ ] Build succeeds with no errors
- [ ] No console errors or warnings
- [ ] Code review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md prepared
- [ ] package.json version updated
- [ ] Commits are clean and descriptive

During release:

- [ ] Commit changes with clear message
- [ ] Create git tag with annotation
- [ ] Push commits and tags to remote
- [ ] Verify tag on GitHub

After release:

- [ ] Monitor deployments
- [ ] Check Vercel build status
- [ ] Verify site functionality
- [ ] Document any issues

---

## Semantic Versioning Decision Tree

```
Is this a breaking change?
├─ YES → Increment MAJOR (v1.0.0 → v2.0.0)
└─ NO  → Is this a new feature?
        ├─ YES → Increment MINOR (v1.0.0 → v1.1.0)
        └─ NO  → Is this a bug fix?
               ├─ YES → Increment PATCH (v1.0.0 → v1.0.1)
               └─ NO  → Don't increment version
```

---

## Version Numbering Examples

### Correctly Incremented
- v1.0.0 → v1.0.1 (patch: bug fix)
- v1.0.1 → v1.1.0 (minor: new feature)
- v1.1.0 → v2.0.0 (major: breaking change)
- v2.0.0 → v2.0.1 (patch: bug fix)
- v2.0.1 → v2.1.0 (minor: new feature)

### Incorrectly Incremented
- ❌ v1.0.0 → v1.0.2 (skip patch)
- ❌ v1.0.0 → v1.2.0 (skip minor)
- ❌ v1.0.0 → v3.0.0 (skip major)

---

## GitHub Integration

### Automatic Release Notes

When you push tags, GitHub automatically:
- Creates a release for each tag
- Generates release notes from commits
- Shows commits since last tag
- Allows downloading source archives

### Manual GitHub Release

```bash
# View GitHub releases
gh release list

# Create release from tag
gh release create v1.3.0 --title "Version 1.3.0" --notes "Release notes here"

# View specific release
gh release view v1.3.0
```

---

## Version Communication

### When Announcing Releases

```
📢 Version 1.3.0 Released

🎉 New Features:
- Feature A
- Feature B

🐛 Bug Fixes:
- Fixed issue X
- Fixed issue Y

📊 Release Notes:
[Link to GitHub release]
```

### Version Documentation

Always include in commits:
- What changed (briefly)
- Why it changed (context)
- Any migration needed
- Links to issues/PRs

---

## Version History

| Version | Date | Type | Summary |
|---------|------|------|---------|
| v1.0.0 | 2026-01-27 | Initial | Next.js migration complete |
| v1.1.0 | 2026-01-27 | Feature | Temporal tracking added |
| v1.2.0 | 2026-01-27 | Feature | Decommissioning automation |
| v2.0.0 | 2026-02-TBD | Major | AWS infrastructure removed |

---

## Best Practices

✅ **DO:**
- Use annotated tags (include message)
- Update CHANGELOG.md before tagging
- Test thoroughly before release
- Use clear commit messages
- Tag only stable, tested code
- Push tags immediately after creation
- Document breaking changes clearly
- Review CHANGELOG before release

❌ **DON'T:**
- Skip patch versions
- Forget to push tags
- Create tags without changelog entry
- Use vague version descriptions
- Release untested code
- Tag intermediate commits
- Mix major/minor/patch increments

---

## Tools & Automation

### Optional: Automated Tools

If you want to automate versioning in the future:

- **`standard-version`** - Bump versions from commit messages
- **`semantic-release`** - Fully automated versioning and publishing
- **`auto`** - GitHub Release automation from PRs

For now, **manual git tags + CHANGELOG.md** is sufficient and requires zero setup.

---

## Q&A

**Q: Can I bump multiple version numbers at once?**  
A: No - increment only the rightmost applicable number. Reset lower numbers to 0. (v1.2.5 → v2.0.0, not v2.1.5)

**Q: Should I tag every commit?**  
A: No - only tag stable, tested releases. Typically 1-2 tags per month.

**Q: What if I made a mistake in a tag?**  
A: Delete and recreate:
```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag -a v1.0.0 -m "Fixed message"
git push origin --tags
```

**Q: How do I reference a version in code?**  
A: Use package.json version:
```bash
VERSION=$(jq -r .version package.json)
echo "sysya-wiki v$VERSION"
```

---

**Last Updated:** January 27, 2026  
**Strategy:** Simple git tags + SemVer format + CHANGELOG.md  
**Status:** ✅ Ready to use
