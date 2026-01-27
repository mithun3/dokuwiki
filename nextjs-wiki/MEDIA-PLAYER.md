# Enhanced Media Player Implementation Guide

## Overview

The Next.js wiki now includes an advanced media player system with support for professional media previews, format detection, and persistent playback across page navigation.

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

The `MediaTrack` TypeScript interface now includes:

```typescript
interface MediaTrack {
  id: string;              // Unique identifier
  url: string;             // Media file URL
  title: string;           // Display title
  artist?: string;         // Optional: Artist/Creator name
  type: 'audio' | 'video'; // Media type
  thumbnail?: string;      // Optional: Preview image URL
  duration?: number;       // Optional: Track length in seconds
  format?: string;         // NEW: File format (mp3, mp4, etc.)
}
```

### 3. MediaCard Component

A new professional media card component displays:
- Large thumbnail image with gradient fallback (blue for audio, orange for video)
- Format badge in top-right corner
- Media type icon (speaker for audio, camera for video) in top-left
- Hover effects with play button overlay
- Title and artist metadata below the thumbnail

**Features:**
- Responsive design
- Shadow and hover animations
- Automatic thumbnail from `data-thumbnail` attribute
- Click-to-play integration with media player

### 4. FormatBadge Component

A reusable component that displays file format tags with intelligent color coding:

```tsx
<FormatBadge format="mp3" type="audio" />  // Blue "MP3" badge
<FormatBadge format="mp4" type="video" />  // Orange "MP4" badge
```

### 5. MediaPlayerProvider Enhancements

The provider now:
- Extracts format from file extension automatically
- Stores format in MediaTrack object
- Passes through `data-thumbnail` and `data-artist` attributes
- Supports all 10 audio/video formats

## Adding Media to Your Pages

### Basic Markdown Links

Use standard markdown links for media files:

```markdown
- [Song Title](https://example.com/song.mp3)
- [Video Title](https://example.com/video.mp4)
```

### With Metadata (Recommended)

Add optional data attributes for professional appearance:

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
```

## Implementation Details

### Component Architecture

```
MediaPlayerProvider (wraps app)
├── Link Interception Engine
│   └── Extracts: URL, title, format, thumbnail, artist
│
├── Zustand Store (useMediaPlayerStore)
│   └── Manages: playlist, currentTrack, isPlaying, volume, etc.
│
└── MediaPlayer (UI)
    ├── MediaCard (preview - future)
    ├── FormatBadge (format indicator)
    └── PlayerControls (play, pause, skip, etc.)
```

### State Management

Uses Zustand for persistence with these key fields:

```typescript
interface PlayerState {
  currentTrack: MediaTrack | null;
  playlist: MediaTrack[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  format?: string;  // NEW: Current track format
  repeatMode: 'none' | 'all' | 'one';
  isShuffled: boolean;
}
```

### Link Detection

The provider uses this regex to detect media files:

```
/\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i
```

Automatically handles:
- URLs with query parameters: `file.mp3?token=abc123`
- CDN URLs: `cdn.example.com/audio/track.mp3`
- Relative URLs: `/media/video.mp4`

## Workflow: Click-to-Play

1. **User clicks media link** on page
2. **Link interception** extracts: url, title, format, thumbnail, artist
3. **MediaTrack object** created with all metadata
4. **Zustand store** updated with current track
5. **MediaPlayer UI** renders at bottom of viewport
6. **Playback starts** automatically
7. **Navigation** to new page preserves playback (no page reload)
8. **Clicking new media** adds to queue or replaces (configurable)

## Testing the Implementation

### 1. Test Audio Playback

Visit `/audio` page:
- See working audio player at bottom
- Format badges show "MP3"
- Player controls function properly
- Navigating away keeps music playing

### 2. Test Video Playback

Visit `/video` page:
- See video player at bottom
- Format badges show "MP4", "WebM"
- Video displays correctly
- Player responsive and functional

### 3. Test Format Detection

Verify format badges appear in MediaPlayer:
- AudioPlayer shows format from currentTrack.format
- VideoPlayer shows format from currentTrack.format
- Colors match: blue for audio, orange for video

### 4. Test Metadata Persistence

When clicking media:
- Title displays correctly
- Artist name shows (if provided)
- Thumbnail visible in player (if provided)
- Format badge displays

## Future Enhancements (Phase 2)

### Queue Conflict Modal
When clicking media while something plays, show:
- **Replace & Play** - Clear queue, play new track
- **Play Next** - Insert after current track
- **Add to Queue** - Append to end

### Media Gallery View
- Dedicated page showing all media as cards
- Filter by format (all, audio only, video only)
- Batch operations (play all, add all to queue)

### Automatic Thumbnail Generation
- Extract video frames for video files
- Generate placeholder images for audio
- Default brand colors for missing thumbnails

### Playlist Management UI
- Visual queue panel
- Drag-to-reorder tracks
- Remove/clear queue buttons
- Save playlists

## File Locations

**New Components:**
- `src/components/MediaPlayer/FormatBadge.tsx` - Format badge display
- `src/components/MediaPlayer/MediaCard.tsx` - Professional media preview

**Modified Files:**
- `src/lib/types.ts` - Added `format` field to MediaTrack
- `src/components/MediaPlayer/MediaPlayerProvider.tsx` - Format extraction
- `nextjs-wiki/README.md` - Updated documentation
- `content/audio.mdx` - Updated with media links
- `content/video.mdx` - Updated with media links

## Troubleshooting

### Format Badge Not Showing

**Cause:** Format not detected from URL  
**Solution:** Ensure file extension is recognized (.mp3, .mp4, etc.)

### Thumbnail Not Displaying

**Cause:** Missing `data-thumbnail` attribute or invalid URL  
**Solution:** Add `data-thumbnail="https://valid-image-url"`

### Media Not Playing

**Cause:** CORS issue or invalid file URL  
**Solution:** Use full URLs, ensure files are CORS-enabled

### Player Not Persistent Across Navigation

**Cause:** Full page reload instead of client-side navigation  
**Solution:** Ensure using Next.js Link or relative URLs

## Architecture Philosophy

The enhanced media player follows these principles:

1. **Progressive Enhancement** - Works with plain markdown links
2. **Automatic Detection** - No manual config needed for formats
3. **Accessible** - Semantic HTML, ARIA labels
4. **Performant** - Lazy loading, client-side only
5. **Extensible** - Easy to add new formats or features
6. **User-Friendly** - Professional UI with clear affordances
