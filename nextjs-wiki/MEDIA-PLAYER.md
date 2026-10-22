# Enhanced Media Player Implementation Guide

## Overview

The Next.js wiki includes an advanced media player system with support for professional media previews, format detection, persistent playback across page navigation, and a robust A/B audio comparison mode.

## Key Features Implemented

### 1. Format Detection & Badges

The media player automatically detects file formats from URLs and displays them as visual badges:

**Supported Formats:**

| Audio | Video |
|-------|-------|
| MP3, WAV, OGG, AAC, M4A, OPUS, FLAC | MP4, WebM, OGV |

Format badges appear as:
- **Blue badges** for audio files (mp3, wav, ogg, etc.)
- **Orange badges** for video files (mp4, webm, ogv)

### 2. MediaTrack Interface Enhancement

The `MediaTrack` TypeScript interface supports rich metadata and overriding A/B attributes:

```typescript
interface MediaTrack {
  id: string;              // Unique identifier
  url: string;             // Media file URL
  title: string;           // Display title
  artist?: string;         // Optional: Artist/Creator name
  type: 'audio' | 'video'; // Media type
  thumbnail?: string;      // Optional: Preview image URL
  duration?: number;       // Optional: Track length in seconds
  format?: string;         // File format (mp3, mp4, etc.)
  abGroupOverride?: string; // Optional: Override for A/B grouping
  abVariantOverride?: string; // Optional: Override for A/B variant (A, B, C, D)
}
```

### 3. MediaCard Component

A professional media card component displaying:
- Large thumbnail image with gradient fallback (blue for audio, orange for video)
- Format badge in top-right corner
- Media type icon (speaker for audio, camera for video) in top-left
- Hover effects with play button overlay
- Title and artist metadata below the thumbnail

### 4. FormatBadge Component

A reusable component that displays file format tags with intelligent color coding:

```tsx
<FormatBadge format="mp3" type="audio" />  // Blue "MP3" badge
<FormatBadge format="mp4" type="video" />  // Orange "MP4" badge
```

### 5. A/B Audio Comparison Mode

An advanced mode that allows users to instantly switch between multiple audio sources (A/B/C/D) at the exact same playback position. Useful for comparing mixes, masters, or audio codecs.

**Core Behavior:**
- **Multi-track comparison**: Support 2-4 synchronized tracks (A/B, A/B/C, A/B/C/D).
- **Instant switching**: Toggle between tracks using a dual audio element approach (muting/unmuting elements instantaneously) with zero load delay.
- **Position sync**: All tracks maintain identical playback position, synced securely on play and seek events.
- **Manual Level Matching**: A built-in Gain slider (±12dB) allowing users to adjust perceptual loudness per variant.
- **Keyboard shortcuts**: `A`, `B`, `C`, `D` keys for instant switching, `Space` for play/pause, `ESC` to exit mode.
- **No playlist integration**: A/B tracks are comparison-only and cannot be added to the regular queue.

**Track Naming Convention:**
A/B track groups are automatically identified by filename pattern:
- `[basename]_A.[ext]` or `[basename]_v1.[ext]`
- `[basename]_B.[ext]` or `[basename]_v2.[ext]`
(e.g., `piano-mix_A.mp3`, `piano-mix_B.mp3`)

Alternatively, explicit grouping can be used via Markdown attributes (see below).

### 6. MediaPlayerProvider Enhancements

The provider now:
- Extracts format from file extension automatically.
- Stores format in MediaTrack object.
- Passes through `data-*` attributes (`thumbnail`, `artist`, `ab-group`, `ab-variant`).
- Recognizes A/B grouping through regex or explicit data attributes and prompts the A/B comparison mode when paired tracks are played.

---

## Adding Media to Your Pages

### Basic Markdown Links

Use standard markdown links for media files:

```markdown
- [Song Title](https://example.com/song.mp3)
- [Video Title](https://example.com/video.mp4)
```

### With Metadata (Recommended)

Add optional data attributes as title tags for professional appearance and explicit grouping:

```markdown
- [Beautiful Symphony](https://cdn.example.com/song.mp3 "data-artist=Composer Name" "data-thumbnail=https://cdn.example.com/cover.jpg")
- [Tutorial Video](https://cdn.example.com/video.mp4 "data-thumbnail=https://cdn.example.com/poster.jpg")
```

**Supported Data Attributes:**

| Attribute | Format | Example | Support |
|-----------|--------|---------|---------|
| `data-thumbnail` | URL | `"data-thumbnail=https://..."` | Audio + Video |
| `data-artist` | Text | `"data-artist=Artist Name"` | Audio Only |
| `data-title` | Text | `"data-title=Custom Title"` | All (defaults to link text) |
| `data-ab-group` | Text | `"data-ab-group=mix-compare"` | Audio Only (A/B) |
| `data-ab-variant` | 'A'\|'B'\|'C'\|'D' | `"data-ab-variant=A"` | Audio Only (A/B) |

### Complete Example

```mdx
---
title: "Music Collection"
---

# Featured Tracks

## Jazz Albums
- [Autumn Leaves](https://cdn.example.com/autumn-leaves.mp3 "data-artist=Bill Evans Trio" "data-thumbnail=https://cdn.example.com/covers/autumn.jpg")
- [In a Sentimental Mood](https://cdn.example.com/sentimental.wav "data-artist=Duke Ellington" "data-thumbnail=https://cdn.example.com/covers/mood.jpg")

## Video Tutorials
- [Getting Started](https://cdn.example.com/intro.mp4 "data-thumbnail=https://cdn.example.com/posters/intro.jpg")
- [Advanced Techniques](https://cdn.example.com/advanced.webm "data-thumbnail=https://cdn.example.com/posters/advanced.jpg")

## A/B Audio Comparison
- [Mix 1 (Original)](https://cdn.example.com/song1.mp3 "data-ab-group=mix-comparison data-ab-variant=A")
- [Mix 2 (Remastered)](https://cdn.example.com/song2.mp3 "data-ab-group=mix-comparison data-ab-variant=B")
```

---

## Implementation Details

### Component Architecture

```
MediaPlayerProvider (wraps app)
├── Link Interception Engine
│   └── Extracts: URL, title, format, thumbnail, artist, ab-overrides
│
├── Zustand Store (useMediaPlayerStore)
│   └── Manages: playlist, currentTrack, isPlaying, volume, A/B state, offsets
│
└── MediaPlayer (UI)
    ├── MediaCard (preview)
    ├── FormatBadge (format indicator)
    ├── ABToggle (variant switcher & gain slider)
    └── PlayerControls (play, pause, skip, etc.)
```

### State Management

Uses Zustand for persistence with these key fields:

```typescript
interface PlayerState {
  currentTrack: MediaTrack | null;
  playlist: MediaTrack[];
  // ... basic player state ...
  isABMode: boolean;
  abGroup: ABTrackGroup | null;
  activeVariant: ABVariant;
  abVolumeOffsets: Record<string, number>;
}
```

### Link Detection

The provider uses this regex to detect media files:
`/\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i`

Automatically handles:
- URLs with query parameters: `file.mp3?token=abc123`
- CDN URLs: `cdn.example.com/audio/track.mp3`
- Relative URLs: `/media/video.mp4`

## Workflow: Click-to-Play

1. **User clicks media link** on page.
2. **Link interception** extracts attributes (`url`, `title`, `thumbnail`, `ab-group`, etc.).
3. **MediaTrack object** created.
4. If it's part of an A/B group and another track from that group is playing, it automatically **enters A/B comparison mode**.
5. Otherwise, **Zustand store** is updated, and **playback starts**.
6. **Navigation** to a new page preserves playback (no page reload).
7. **Clicking new media** checks for queue conflicts and prompts user (Replace, Play Next, Add to Queue).

---

## Testing the Implementation

### Checklist
- [ ] **Audio Playback:** Navigating away keeps music playing.
- [ ] **Video Playback:** Format badges ("MP4", "WebM") display correctly.
- [ ] **Metadata Persistence:** Title, Artist, and Thumbnail display correctly in player.
- [ ] **A/B Mode:** Play two tracks in an A/B group.
- [ ] **A/B Toggle & Gain:** A/B toggle buttons work correctly, gain slider changes output levels visually and audibly.
- [ ] **A/B Hotkeys:** Pressing A/B/C/D switches instantly. Position stays synced.
- [ ] **A/B Cleanup:** ESC exits mode. Audio does not bleed/ghost in the background.

---

## Troubleshooting

- **Format Badge Not Showing:** Ensure file extension is recognized.
- **Thumbnail Not Displaying:** Ensure valid URL in `data-thumbnail` attribute.
- **Media Not Playing:** Check CORS issues or invalid URL.
- **Player Not Persistent:** Ensure using Next.js Link or relative URLs for client-side navigation.
- **A/B Group Not Linking:** Check if `data-ab-group` matches exactly across links, or ensure filenames strictly follow `[basename]_A.ext` format.

---

## Architecture Philosophy

1. **Progressive Enhancement:** Works with plain markdown links.
2. **Automatic Detection:** No manual config needed for formats or basic A/B testing.
3. **Accessible:** Semantic HTML, ARIA labels.
4. **Performant:** Lazy loading, isolated re-renders, anchor-based synchronization.
5. **Extensible:** Easy to add new formats or features.
6. **User-Friendly:** Professional UI with clear affordances.

---

## Development Roadmap & Future Enhancements

### 1. Visual Waveform Comparison

**Goal:** Add interactive waveform visualization to `AudioCard` and `ABComparisonCard` to display amplitude over time and allow users to preview content.

**Recommended Approach (wavesurfer.js):**
1. Implement a lazy-loaded `<Waveform>` component using `wavesurfer.js` (~45KB gzipped).
2. Load waveform only when the card is in the viewport (IntersectionObserver) or on hover.
3. Phase 2 optimization: Pre-compute waveforms (JSON data) using `audiowaveform` CLI in CI/CD pipeline.
4. Interactive Features: Click-to-seek, playback progress, overlay both waveforms for A/B visual comparison.

### 2. Audio Card & UI Enhancements

- **Queue Conflict Handling:** Add configuration to toggle between inline buttons (Play Now / Add to Queue) and a single click `QueueConflictModal`.
- **A/B Auto-Detection:** Add `autoDetect={true}` mode to `ABComparisonCard` to fetch variants automatically from a `baseUrl`.
- **Styling Consistency:** Align `MediaCard`, `AudioCard`, and `ABComparisonCard` with consistent border-radius (`rounded-xl`), shadows, and format badges.
- **Duration Display:** Extract duration from audio metadata on load and cache in localStorage.
- **Download/Share/Bookmarks:** Add quick actions to download, copy direct URLs, and bookmark tracks (persisted in localStorage).
- **Dark Mode:** Ensure cards work seamlessly in dark mode via CSS variables.

### 3. Advanced ABX Testing Mode

- **Blind ABX test mode:** A scientific testing UI that hides labels and randomizes X selection.
- **Trial counter & statistics:** Track user choices and calculate success rates.
- **Auto LUFS normalization:** Automatically calculate and apply gain offsets to balance loudness natively.

### 4. Playlist Management UI

- **Visual queue panel:** Advanced panel allowing drag-to-reorder tracks.
- **Queue operations:** Remove/clear queue buttons.
- **Save playlists:** Persist dynamic playlists natively.
