# 🚀 Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Setup (2 minutes)
```bash
chmod +x scripts/setup-nextjs.sh
./scripts/setup-nextjs.sh
```

### Step 2: Start Dev Server (1 minute)
```bash
cd nextjs-wiki
npm run dev
```

### Step 3: Open Browser
Visit: http://localhost:3000

### Step 4: Test Media Player
Click any audio link on a page - player appears at bottom!

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Check for errors

# Content
../scripts/convert-to-mdx.sh  # Convert DokuWiki to MDX

# Deployment
git push origin migrate   # Auto-deploy to Vercel (after setup)
```

---

## File Structure

```
nextjs-wiki/
├── src/app/              # Pages and layouts
├── src/components/       # React components + Media Player
├── content/              # MDX content files
└── public/               # Static assets (images, etc.)
```

---

## Add New Page

1. Create `content/my-page.mdx`:
```mdx
---
title: "My Page"
---

# My Page

Content here...
```

2. Add to sidebar: `src/components/Sidebar.tsx`

---

## Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin migrate
```

2. Visit https://vercel.com
3. Import repository
4. Set root directory: `nextjs-wiki/`
5. Deploy!

---

## Troubleshooting

**Player doesn't work?**
- Check console for errors
- Verify link has `.mp3`, `.wav`, `.mp4` extension

**Page not found?**
- Check file exists in `content/`
- Verify frontmatter YAML is valid

**Build fails?**
- Run `npm run type-check`
- Check all dependencies installed

---

## Documentation

- `README.md` - Full migration guide
- `AWS-DECOMMISSION.md` - Infrastructure cleanup
- `IMPLEMENTATION-SUMMARY.md` - What was built

---

## Media Player Features

- ✅ Persistent across pages (no audio interruption)
- ✅ Automatic link detection (`.mp3`, `.wav`, `.mp4`)
- ✅ Playlist queue
- ✅ Volume control
- ✅ Shuffle & repeat
- ✅ Saves state on refresh

---

**Need help?** Read the full README in nextjs-wiki/
