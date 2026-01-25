# Adding New Content Pages

This guide explains how to add new pages to DokuWiki using git-first workflow with native DokuWiki syntax.

## Content Structure

```
content/pages/          # DokuWiki .txt files (git-tracked source of truth)
├── home.txt            # Homepage
├── sidebar.txt         # Sidebar navigation
├── recording/          # Namespace (folder)
│   ├── recording.txt   # Namespace index
│   ├── best-practices.txt
│   └── foley-essentials.txt
└── sounds/
    ├── sounds.txt
    └── urban-ambience.txt
```

- Write pages in **native DokuWiki format** (`.txt` files)
- Filenames become page URLs (e.g., `my-page.txt` → `/my-page`)
- Folders become **namespaces** (e.g., `sounds/my-sound.txt` → `/sounds:my-sound`)

---

## DokuWiki Syntax Quick Reference

### Headers
```
====== Heading 1 (6 equals) ======
===== Heading 2 (5 equals) =====
==== Heading 3 (4 equals) ====
=== Heading 4 (3 equals) ===
```

### Lists
```
  * Unordered (2 spaces + asterisk)
    * Nested level 2 (4 spaces)
      * Nested level 3 (6 spaces)

  - Ordered (2 spaces + dash)
    - Nested level 2 (4 spaces)
```

### Formatting
```
*bold text*
//italic text//
'inline code'

**not bold** — double asterisks don't work in DokuWiki
```

### Links
```
[[page|Link Text]]              # Internal link to page
[[namespace:page|Link Text]]    # Link to namespaced page
[[recording:best-practices|Recording Best Practices]]

[[https://example.com|External Link]]
```

### Images
```
{{:image.png|Alt text}}
{{:sounds/audio.png|Sound icon}}

{{:image.png?300|Resized image}}
```

### Tables
```
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Code Blocks
```
<code>
function example() {
  return true;
}
</code>
```

---

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

### Step 3: Create the DokuWiki File

```bash
# Single page at root level
touch content/pages/microphone-guide.txt

# Or page in a namespace (folder)
mkdir -p content/pages/guides
touch content/pages/guides/microphone-guide.txt
```

### Step 4: Write Your Content

Use native DokuWiki syntax (see reference above).

```
====== Microphone Guide ======

Introduction paragraph explaining microphones.

===== Microphone Types =====

  * Condenser microphones
    * Best for studios
    * Require phantom power
  * Dynamic microphones
    * Best for live recording
    * No power required

===== Selecting a Microphone =====

See also: [[recording:equipment-guide|Equipment Guide]]

For more information, visit [[https://en.wikipedia.org/wiki/Microphone|Wikipedia]].
```

### Step 5: Update the Sidebar (Optional)

If you want the page in navigation, edit `content/pages/sidebar.txt`:

```
  * [[home|Home]]
  * [[recording:recording|Recording]]
  * [[guides:microphone-guide|Microphone Guide]]
  * [[sounds:sounds|Sounds]]
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
     - Added `content/pages/guides/microphone-guide.txt`
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
1. Rebuilds the Docker image (includes your new seed `.txt` files)
2. Pushes to ECR
3. Deploys to ECS

**Monitor the deployment:**
- Go to **Actions** tab to watch the workflow
- Check your wiki URL to verify the new page is live

---

## Quick Command Reference

```bash
# Full workflow from start to finish
git fetch origin && git checkout main && git pull origin main
git checkout -b content/42-microphone-guide

# Create file
mkdir -p content/pages/guides
touch content/pages/guides/microphone-guide.txt

# Edit file in your editor
# ... add DokuWiki content ...

# Commit and push
git add content/pages/
git commit -m "content: add microphone guide

Closes #42"
git push -u origin content/42-microphone-guide

# Create PR on GitHub and merge
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

- Use lowercase filenames with hyphens: `my-page.txt` not `My Page.txt`
- Create an index file for each namespace: `recording/recording.txt` for `/recording:` namespace
- Keep namespace depth shallow (max 2-3 levels)
- Group related content together

---

## Editing Existing Pages in Web UI

You can edit pages directly in the DokuWiki web interface:

1. Go to your wiki URL (e.g., https://example.com)
2. Login with admin credentials
3. Navigate to the page
4. Click "Edit this page"

**Important:** Web edits are stored in the container's EFS volume and won't automatically sync to git. To keep git as the source of truth:
- Edit in `app/seed/data/pages/` in git for version-controlled changes
- Use web UI only for minor corrections or temporary edits
- To persist web edits to git: copy updated files from container to `app/seed/data/pages/`, review, and commit

---

## Troubleshooting

### Page not appearing after push?
- Ensure file is in correct location: `content/pages/your-page.txt`
- Check PR was merged to `main`
- Wait for GitHub Actions workflow to complete
- Check Docker image was rebuilt: `docker images | grep dokuwiki`
- Clear browser cache or restart docker-compose

### Links not working?
- Use lowercase namespace names: `[[recording:page]]` not `[[Recording:page]]`
- Use colon (`:`) for namespaced links, not slash (`/`)
- Check link target file exists: `content/pages/namespace/page.txt`

### Formatting looks wrong locally?
- Verify DokuWiki syntax is correct (see reference above)
- Restart docker-compose: `docker-compose down && docker-compose up --build`
- Check DokuWiki error logs: `docker-compose logs dokuwiki`
