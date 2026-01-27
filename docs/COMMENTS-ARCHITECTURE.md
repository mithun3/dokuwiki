# How Giscus Comments Work: Page Isolation Guide

## Overview

This wiki uses **Giscus** for comments. Giscus is a GitHub Discussions-powered comment system that isolates comments **per page** using URL pathname mapping.

**Key Question:** If someone comments on `/recording`, will that comment appear on `/sounds`?

**Answer:** ❌ **No.** Each page has its own isolated discussion thread in GitHub.

---

## 🔑 The Core Mechanism: Pathname Mapping

Giscus uses URL pathname mapping to create a **one-to-one relationship** between pages and GitHub Discussion threads.

### How It Works

```typescript
// In src/components/Comments.tsx:
script.dataset.mapping = 'pathname';
```

This single line tells Giscus:
> "Use the page's URL path as a unique identifier. Create one GitHub Discussion thread per unique path."

### Path to Discussion Mapping

When you visit different pages, Giscus automatically:

| Page URL | Path | GitHub Discussion Thread |
|----------|------|-------------------------|
| `http://localhost:3000/recording` | `/recording` | Discussion: "recording" |
| `http://localhost:3000/sounds` | `/sounds` | Discussion: "sounds" |
| `http://localhost:3000/about` | `/about` | Discussion: "about" |
| `http://localhost:3000/contact` | `/contact` | Discussion: "contact" |
| `http://localhost:3000/equipment/equipment` | `/equipment/equipment` | Discussion: "equipment/equipment" |

Each path gets its own GitHub Discussion thread. **No sharing between pages.**

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│            Your Browser (Frontend)                  │
│  Navigate between pages like /recording, /sounds    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Giscus Component on each page
                   ├─ Reads current URL pathname
                   ├─ Sends pathname to Giscus backend
                   │
┌──────────────────▼──────────────────────────────────┐
│         Giscus App (GitHub Discussions)             │
│                                                     │
│  Maps each pathname to unique discussion thread    │
│  (/recording → thread#1, /sounds → thread#2, etc) │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Stores all discussions in:
                   │
┌──────────────────▼──────────────────────────────────┐
│      GitHub Repository: mithun3/dokuwiki            │
│                                                     │
│  Discussions Category: "Comments"                   │
│  ├─ Thread: "recording" (5 comments)               │
│  ├─ Thread: "sounds" (3 comments)                  │
│  ├─ Thread: "about" (8 comments)                   │
│  ├─ Thread: "contact" (2 comments)                 │
│  └─ Thread: "equipment/equipment" (1 comment)      │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 User Journey Example

Let's trace a real user's path through your wiki:

### Timeline

```
09:00 AM - User visits /recording
├─ Browser URL: http://localhost:3000/recording
├─ Comments.tsx component loads
├─ Giscus reads pathname: "/recording"
├─ Giscus creates/loads GitHub Discussion: "recording"
├─ Comments section shows discussion for recording page
├─ User reads: "Great field recording tips!" (existing comment)
├─ User types comment: "Love the techniques!"
└─ Comment stored in GitHub Discussion thread: "recording"

09:15 AM - User navigates to /sounds
├─ Browser URL changes to: http://localhost:3000/sounds
├─ Comments.tsx component re-renders
├─ Giscus detects NEW pathname: "/sounds"
├─ Giscus creates/loads DIFFERENT GitHub Discussion: "sounds"
├─ Comments section is EMPTY or shows sounds comments only
├─ User's previous comment "Love the techniques!" is NOT visible
├─ User comments: "Great sound library!"
└─ New comment stored in GitHub Discussion thread: "sounds"

09:30 AM - User navigates back to /recording
├─ Browser URL: http://localhost:3000/recording
├─ Comments.tsx component re-renders
├─ Giscus detects pathname: "/recording" (same as before)
├─ Giscus loads same GitHub Discussion: "recording"
├─ User's comment "Love the techniques!" is VISIBLE again!
└─ Persistence confirmed: data stored in GitHub, not temporary
```

---

## 🏗️ Technical Implementation

### Your Comments Component

```typescript
// src/components/Comments.tsx
'use client';

import { useEffect } from 'react';

export default function Comments() {
  useEffect(() => {
    // Load Giscus script dynamically
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    
    // Configuration:
    script.dataset.repo = 'mithun3/dokuwiki';           // GitHub repo
    script.dataset.repoId = 'R_kgDOQ6N5_A';             // Repo ID
    script.dataset.category = 'Comments';               // Discussion category
    script.dataset.categoryId = 'DIC_kwDOQ6N5_M4C1ciQ'; // Category ID
    script.dataset.mapping = 'pathname';                // ← KEY SETTING
    script.dataset.reactionsEnabled = '1';              // Allow reactions
    script.dataset.theme = 'light';                     // Light theme
    
    // Mount script to DOM
    const commentsContainer = document.getElementById('giscus');
    if (commentsContainer) {
      commentsContainer.appendChild(script);
    }
  }, []);

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="mb-6 text-2xl font-bold">💬 Comments & Discussion</h2>
      <div id="giscus" className="mx-auto max-w-4xl" />
    </div>
  );
}
```

### Where Comments Appear

Comments are added to every page via the dynamic routing:

```typescript
// src/app/[...slug]/page.tsx
export default function ContentPage({ params }: { params: { slug: string[] } }) {
  const content = getContentBySlug(params.slug);

  return (
    <article className="wiki-content">
      <MDXRemote source={content.content} ... />
      <Comments />  {/* ← Added here */}
    </article>
  );
}
```

This means:
- ✅ Every page route `[...slug]` gets a Comments component
- ✅ Each route has a unique pathname
- ✅ Each pathname gets its own isolated discussion thread

---

## 📍 Mapping Options Explained

Giscus supports 5 different mapping strategies. Here's why `pathname` is best for your wiki:

### 1. **Pathname** (✅ What You're Using)

```typescript
script.dataset.mapping = 'pathname';
```

**How it works:**
- Uses the URL path: `/recording`, `/sounds`, `/about`
- One discussion per unique path
- Discussion names are clean and readable

**Pros:**
- ✅ Perfect for wikis and docs
- ✅ Automatic per-page isolation
- ✅ No extra configuration needed
- ✅ Works with dynamic routing
- ✅ Clean discussion thread names

**Example:**
```
/recording        → Discussion "recording"
/sounds           → Discussion "sounds"
/about            → Discussion "about"
/equipment/video  → Discussion "equipment/video"
```

---

### 2. URL

```typescript
script.dataset.mapping = 'url';
```

**How it works:**
- Uses full URL including domain and query params
- Breaks when you change deployment URL

**Cons:**
- ❌ Breaks if domain changes (localhost vs production)
- ❌ Query params create separate threads (`?v=1` vs no params)
- ❌ Not recommended for wikis

---

### 3. Title

```typescript
script.dataset.mapping = 'title';
```

**How it works:**
- Uses HTML `<title>` tag content

**Cons:**
- ❌ Multiple pages with same title share comments
- ❌ Title changes break thread references
- ❌ Not suitable for dynamic sites

---

### 4. OG:Title

```typescript
script.dataset.mapping = 'og:title';
```

**How it works:**
- Uses OpenGraph `og:title` meta tag

**Cons:**
- ❌ Similar issues as Title mapping
- ❌ Requires manual meta tag management

---

### 5. Number

```typescript
script.dataset.mapping = 'number';
script.dataset.term = '123'; // Manual discussion ID
```

**How it works:**
- Maps all pages to single discussion ID
- Must manually configure per page

**Cons:**
- ❌ All pages share comments (wrong for you)
- ❌ Requires manual configuration on each page
- ❌ Not scalable

---

### 6. Specific

```typescript
script.dataset.mapping = 'specific';
script.dataset.term = 'my-discussion';
```

**How it works:**
- All pages use same fixed discussion

**Result:**
- ❌ ALL comments from all pages appear on every page
- ❌ No isolation at all
- ❌ Not what you want

---

## ✅ Your Current Setup

Your configuration is **perfectly optimized** for per-page isolation:

```typescript
script.dataset.mapping = 'pathname';  // Pathname-based isolation ✓
script.dataset.repo = 'mithun3/dokuwiki';
script.dataset.category = 'Comments';
```

**This guarantees:**
- ✅ Comments on `/recording` only appear on `/recording`
- ✅ Comments on `/sounds` only appear on `/sounds`
- ✅ Each page is completely isolated
- ✅ No configuration needed per page
- ✅ Automatic scaling as you add new pages

---

## 🔍 How to View All Comments

Comments are stored in your GitHub repository. To see all discussions:

### In Browser

1. Go to: https://github.com/mithun3/dokuwiki/discussions
2. Filter by: "Comments" category
3. You'll see all discussion threads (one per page)

**Example view:**
```
Discussions > Comments Category

1. recording (5 comments)
   ├─ Great recording tips! (by user1)
   ├─ Love the techniques! (by user2)
   └─ ...

2. sounds (3 comments)
   ├─ Amazing sound library! (by user1)
   └─ ...

3. about (8 comments)
   ├─ Inspiring journey! (by user3)
   └─ ...
```

### Via GitHub API

```bash
# Get all discussions for your repo
gh api graphql -f query='query {
  repository(owner: "mithun3", name: "dokuwiki") {
    discussions(first: 100) {
      nodes {
        title
        body
        comments(first: 10) {
          nodes { body author { login } }
        }
      }
    }
  }
}'
```

---

## 🔐 Data Storage

### Where Comments Live

**Frontend (Your Pages):**
- Comments component on each page
- Displays only comments for that specific page's discussion

**Backend (GitHub Discussions):**
- All discussions stored in your repository
- Organized by category: "Comments"
- One discussion per URL pathname
- Permanent storage with version history

### Example Repository Structure

```
mithun3/dokuwiki (GitHub)
└─ Discussions
   └─ Comments Category
      ├─ Discussion #1: "recording"
      │  └─ 5 comments
      ├─ Discussion #2: "sounds"
      │  └─ 3 comments
      ├─ Discussion #3: "about"
      │  └─ 8 comments
      └─ Discussion #4: "contact"
         └─ 2 comments
```

---

## 💾 Backup & Persistence

Your comments are backed up weekly via GitHub Actions:

```yaml
# .github/workflows/backup-discussions.yml
- Runs: Every Monday at 00:00 UTC
- Exports: All discussions to JSON files
- Location: backups/discussions/discussions-YYYYMMDD_HHMMSS.json
- Version: Tracked in git history
```

**Access backups:**
```bash
cd backups/discussions/
ls -la  # View all backup files
cat discussions-20260126_000000.json  # View specific backup
```

---

## 🎯 Common Questions

### Q: If I comment on /recording, will it appear on /sounds?
**A:** ❌ No. Each page has its own isolated discussion thread. Comments are completely separate.

### Q: Can I see all comments across all pages?
**A:** ✅ Yes. Go to GitHub Discussions dashboard: https://github.com/mithun3/dokuwiki/discussions

### Q: Are comments permanent?
**A:** ✅ Yes. Comments are stored in GitHub Discussions permanently. They persist across browser sessions and page navigations.

### Q: What if I change a URL path?
**A:** The comments for that path will be lost. Giscus uses the current path as the key, so `/old-page` and `/new-page` would have separate discussion threads.

### Q: Can I export comments?
**A:** ✅ Yes. Backups run weekly and are stored in `backups/discussions/`. You can also manually export via GitHub Discussions dashboard.

### Q: What if someone deletes a comment?
**A:** The comment is deleted from that page's discussion thread but remains in backups (if already backed up).

### Q: Can I migrate comments to another system?
**A:** ✅ Yes. All comments are exported as JSON in `backups/discussions/`. You can parse and import into another system.

---

## 🚀 How Page Isolation Benefits Your Wiki

1. **Relevance**: Comments stay focused on their specific topic
2. **Organization**: No cross-page clutter or confusion
3. **Moderation**: Easier to manage discussions per page
4. **Scalability**: Works automatically as you add new pages
5. **User Experience**: Users see only relevant comments for the page they're reading
6. **Data Integrity**: No accidental cross-page pollution

---

## 📚 Related Documentation

- [Giscus Documentation](https://giscus.app)
- [GitHub Discussions](https://docs.github.com/en/discussions)
- [Setup Guide](../GISCUS-SETUP.md)
- [Backup Strategy](../GISCUS-SETUP.md#backup-strategy)

---

## Summary

Your wiki uses **pathname-based comment isolation** via Giscus:

✅ Each page has its own isolated GitHub Discussion thread  
✅ Comments on `/recording` do NOT appear on `/sounds`  
✅ All discussions stored permanently in GitHub  
✅ Weekly automatic backups in JSON format  
✅ Complete data portability and export capability  
✅ No configuration needed per page  
✅ Scales automatically as you add new pages  

**The key mechanism:** `script.dataset.mapping = 'pathname'` in your Comments component ensures that each unique URL path maps to exactly one GitHub Discussion thread.
