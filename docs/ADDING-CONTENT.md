# Adding New Content Pages

This guide explains how to add new pages to the DokuWiki using a proper Git workflow.

## Content Structure

```
content/
└── pages/
    ├── home.md           # Homepage
    ├── sidebar.md        # Sidebar navigation
    ├── recording/        # Namespace (folder)
    │   ├── recording.md  # Namespace index
    │   └── foley-essentials.md
    └── sounds/
        ├── sounds.md
        └── urban-ambience.md
```

- Write pages in **Markdown** format
- Filenames become page URLs (e.g., `my-page.md` → `/my-page`)
- Folders become **namespaces** (e.g., `sounds/my-sound.md` → `/sounds:my-sound`)

---

## Workflow: Adding a New Page

### Step 1: Create a GitHub Issue

Before starting work, create an issue to track the content addition.

1. Go to your repository on GitHub
2. Click **Issues** → **New issue**
3. Fill in:
   - **Title:** `Add page: <page-name>` (e.g., "Add page: microphone-guide")
   - **Description:** Brief description of the content to be added
   - **Labels:** `content`, `documentation` (create if needed)
4. Click **Submit new issue**
5. Note the issue number (e.g., `#42`)

### Step 2: Create a Feature Branch

```bash
# Fetch latest changes
git fetch origin
git checkout main
git pull origin main

# Create a branch named after the issue
# Format: content/<issue-number>-<short-description>
git checkout -b content/42-microphone-guide
```

### Step 3: Create the Markdown File

```bash
# Single page at root level
touch content/pages/microphone-guide.md

# Or page in a namespace (folder)
mkdir -p content/pages/guides
touch content/pages/guides/microphone-guide.md
```

### Step 4: Write Your Content

Use standard Markdown syntax. The build process converts it to DokuWiki format.

```markdown
# Page Title

Introduction paragraph.

## Section Heading

- Bullet point
- Another point

### Subsection

1. Numbered list
2. Second item

**Bold text** and `inline code`.

[Link to another page](sounds/sounds.md)
[External link](https://example.com)

![Image alt text](recording/image.png)
```

### Step 5: Update the Sidebar (Optional)

If you want the page in navigation, edit `content/pages/sidebar.md`:

```markdown
- [Home](home.md)
- [Microphone Guide](guides/microphone-guide.md)
```

### Step 6: Commit and Push to Your Branch

```bash
# Stage your changes
git add content/pages/

# Commit with a message that references the issue
git commit -m "content: add microphone guide

Closes #42"

# Push your branch to GitHub
git push -u origin content/42-microphone-guide
```

### Step 7: Create a Pull Request

1. Go to your repository on GitHub
2. You'll see a banner: "content/42-microphone-guide had recent pushes" → Click **Compare & pull request**
   - Or go to **Pull requests** → **New pull request**
3. Fill in:
   - **Base:** `main` ← **Compare:** `content/42-microphone-guide`
   - **Title:** `Add microphone guide page`
   - **Description:**
     ```
     ## Summary
     Adds a new guide for microphone selection and placement.
     
     ## Changes
     - Added `content/pages/guides/microphone-guide.md`
     - Updated sidebar navigation
     
     Closes #42
     ```
4. Click **Create pull request**

### Step 8: Review and Merge

**If you're the reviewer:**
1. Go to the PR → **Files changed** tab
2. Review the content changes
3. Add comments if needed or click **Approve**

**To merge:**
1. Ensure all checks pass (if CI is configured)
2. Click **Merge pull request** → **Confirm merge**
3. Optionally click **Delete branch** to clean up

### Step 9: Deploy

After merging to `main`, GitHub Actions automatically:
1. Rebuilds the Docker image (converts Markdown → DokuWiki syntax)
2. Pushes to ECR
3. Deploys to ECS

**Monitor the deployment:**
- Go to **Actions** tab to watch the workflow
- Check https://sysya.com.au to verify the new page is live

---

## Quick Command Reference

```bash
# Full workflow from start to finish
git fetch origin && git checkout main && git pull origin main
git checkout -b content/42-microphone-guide
# ... create and edit files ...
git add content/pages/
git commit -m "content: add microphone guide

Closes #42"
git push -u origin content/42-microphone-guide
# ... create PR on GitHub, review, merge ...
```

---

## Quick Reference: Markdown to DokuWiki Conversion

| Markdown | DokuWiki |
|----------|----------|
| `# H1` | `====== H1 ======` |
| `## H2` | `===== H2 =====` |
| `### H3` | `==== H3 ====` |
| `- bullet` | `  * bullet` |
| `1. numbered` | `  - numbered` |
| `**bold**` | `*bold*` |
| `` `code` `` | `'code'` |
| `[text](url)` | `[[url|text]]` |
| `![alt](img)` | `{{:img|alt}}` |

---

## Local Preview

To preview changes locally before pushing:

```bash
# Build and run locally
docker-compose up --build

# Visit http://localhost:8080
```

---

## Adding Media Files

For images and downloads:

1. **Small files** (< 1MB): Add to `content/pages/` alongside your markdown
2. **Large files**: Upload to the S3 media bucket and reference the CDN URL

```bash
# Upload to S3 media bucket
AWS_PROFILE=my-creds aws s3 cp my-file.mp3 s3://dokuwiki-media-example/sounds/

# Reference in markdown using CDN URL
# https://media.sysya.com.au/sounds/my-file.mp3
```

---

## Namespace Best Practices

- Use lowercase filenames with hyphens: `my-page.md` not `My Page.md`
- Create an index file for each namespace: `sounds/sounds.md`
- Keep namespace depth shallow (max 2-3 levels)
- Group related content together

---

## Editing Existing Pages

You can also edit pages directly in the DokuWiki web interface:

1. Go to https://sysya.com.au
2. Login with admin credentials
3. Navigate to the page
4. Click "Edit this page"

**Note:** Web edits are stored in EFS and won't be in git. For version-controlled content, always edit the Markdown files in `content/pages/`.
