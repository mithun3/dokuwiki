# Adding New Content Pages

This guide explains how to add new pages to the DokuWiki.

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

### Step 1: Create the Markdown File

```bash
# Single page at root level
touch content/pages/my-new-page.md

# Page in a namespace (folder)
mkdir -p content/pages/guides
touch content/pages/guides/getting-started.md
```

### Step 2: Write Your Content

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

### Step 3: Update the Sidebar (Optional)

If you want the page in navigation, edit `content/pages/sidebar.md`:

```markdown
- [Home](home.md)
- [New Page](my-new-page.md)
- [Guides](guides/getting-started.md)
```

### Step 4: Commit and Push

```bash
git add content/pages/
git commit -m "content: add new page - my-new-page"
git push
```

### Step 5: Deploy

The GitHub Actions workflow automatically:
1. Rebuilds the Docker image (converts Markdown → DokuWiki syntax)
2. Pushes to ECR
3. Deploys to ECS

Or trigger manually:
```bash
# Via GitHub Actions
# Go to Actions → Build & Push Image → Run workflow

# Or deploy locally
AWS_PROFILE=my-creds ./scripts/deploy-ecr-image.sh
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
