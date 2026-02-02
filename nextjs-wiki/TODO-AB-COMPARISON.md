# A/B Audio Comparison Feature

## Overview

Add an A/B comparison mode to the MediaPlayer that allows users to instantly switch between multiple audio sources (A/B/C/D) at the same playback position—useful for comparing mixes, masters, or audio codecs.

**Status:** ✅ Phase 1 Complete

---

## Feature Requirements

### Core Behavior

| Requirement | Description |
|-------------|-------------|
| **Multi-track comparison** | Support 2-4 synchronized tracks (A/B, A/B/C, A/B/C/D) |
| **Instant switching** | Toggle between tracks at exact same position (<10ms) |
| **Position sync** | All tracks maintain identical playback position |
| **Visual track selector** | Buttons showing A, B, C, D with active state |
| **Keyboard shortcuts** | A, B, C, D keys for instant switching |
| **Same-length enforcement** | Tracks must be approximately same duration (±5 seconds) |
| **No playlist integration** | A/B tracks are comparison-only, cannot be added to regular queue |

### Track Naming Convention

A/B track groups are identified by filename pattern:

```
[basename]_A.[ext]   or   [basename]_v1.[ext]
[basename]_B.[ext]   or   [basename]_v2.[ext]
[basename]_C.[ext]   or   [basename]_v3.[ext]
[basename]_D.[ext]   or   [basename]_v4.[ext]
```

**Examples:**
- `piano-mix_A.mp3`, `piano-mix_B.mp3`
- `vocal_v1.wav`, `vocal_v2.wav`, `vocal_v3.wav`
- `master-2024_A.flac`, `master-2024_B.flac`

---

## Implementation Progress

### Phase 1: MVP (Target) ✅ COMPLETE

| Task | File | Status |
|------|------|--------|
| Add `ABTrackGroup` interface | `src/lib/types.ts` | ✅ Complete |
| Create `abUtils.ts` detection helpers | `src/lib/abUtils.ts` | ✅ Complete |
| Add A/B state to Zustand store | `src/lib/store.ts` | ✅ Complete |
| Create `ABToggle.tsx` component | `src/components/MediaPlayer/ABToggle.tsx` | ✅ Complete |
| Add multi-audio element support | `MediaPlayer.tsx` | ✅ Complete |
| Add A/B keyboard shortcuts | `KeyboardShortcuts.tsx` | ✅ Complete |
| Update link interception for A/B | `MediaPlayerProvider.tsx` | ✅ Complete |
| Update documentation | `MEDIA-PLAYER.md` | 🔲 Pending |

### Phase 2: Enhanced UX (Future)

| Feature | Complexity | Status |
|---------|------------|--------|
| Manual level matching (dB slider) | Medium | 🔲 |
| Explicit `data-ab-group` attribute | Low | 🔲 |
| Visual waveform comparison | High | 🔲 |

### Phase 3: ABX Testing (Future)

| Feature | Complexity | Status |
|---------|------------|--------|
| Blind ABX test mode | Medium | 🔲 |
| Randomized X selection | Low | 🔲 |
| Trial counter & statistics | Medium | 🔲 |
| Auto LUFS normalization | High | 🔲 |

---

## Technical Architecture

### Dual Audio Element Approach

For instant A/B switching without loading delay:

1. **Preload all tracks** into separate `<audio>` elements
2. **Sync playhead**: Keep all elements' `currentTime` in sync
3. **Toggle by muting**: Switch by toggling `muted` property (instant)
4. **Single play/pause**: All elements play simultaneously, only one audible

```
Audio A: [▶ playing, unmuted]  ←→  Audio B: [▶ playing, muted]
                   Toggle = instant switch (no load)
```

### UI Mockup

```
┌──────────────────────────────────────────────────────┐
│  🎵 Piano Mix - A/B Comparison                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│     ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │
│     │  A  │  │  B  │  │  C  │  │  D  │   ⏸  Pause  │
│     │ ✓✓✓ │  │     │  │     │  │     │             │
│     └─────┘  └─────┘  └─────┘  └─────┘             │
│     (active)                                         │
│                                                      │
│  ▶────────────●────────────────────────── 2:34      │
│                                                      │
│  💡 Press A, B, C, or D to switch • ESC to exit     │
└──────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts (A/B Mode Only)

| Key | Action |
|-----|--------|
| `A` | Switch to Track A |
| `B` | Switch to Track B |
| `C` | Switch to Track C (if available) |
| `D` | Switch to Track D (if available) |
| `Space` | Play/Pause |
| `Escape` | Exit A/B mode, return to regular playback |

---

## Content Authoring

### Markdown Syntax for A/B Tracks

**Option 1: Automatic Detection (Naming Convention)**

```markdown
## Mix Comparison

- [Piano Mix A](https://cdn.example.com/piano-mix_A.mp3)
- [Piano Mix B](https://cdn.example.com/piano-mix_B.mp3)
```

System detects matching base name + variant suffix → offers "Compare A/B" option.

**Option 2: Explicit Grouping (Data Attribute)**

```markdown
## Mix Comparison

- [Original Mix](song_original.mp3 "data-ab-group=song-compare" "data-ab-variant=A")
- [Remastered](song_remaster.mp3 "data-ab-group=song-compare" "data-ab-variant=B")
```

---

## Industry References

| Tool | Type | Key Feature |
|------|------|-------------|
| [ABX (jaakkopasanen)](https://github.com/jaakkopasanen/abx) | Web app | Scientific ABX testing |
| [foobar2000 + foo_abx](https://www.foobar2000.org/components/view/foo_abx) | Desktop plugin | Blind test, level matching |
| [ABmyMix](https://abmymix.com/) | Web app | Drag-drop, browser-based |

---

## Testing Checklist

- [ ] Enter A/B mode with two tracks
- [ ] A/B toggle buttons work correctly
- [ ] Pressing A/B keys switches instantly
- [ ] Position stays synced when switching
- [ ] ESC exits A/B mode
- [ ] Regular queue unchanged during A/B mode

---

## Version History

| Date | Version | Notes |
|------|---------|-------|
| 2026-02-01 | 0.1 | Initial TODO created |
| 2026-02-01 | 0.2 | Phase 1 implementation started |
| 2026-02-01 | 1.0 | Phase 1 MVP complete - All core files implemented |

---

## Files Created/Modified

### New Files
- `src/lib/abUtils.ts` - A/B detection utilities (parseABFilename, isSameABGroup, createABGroup)
- `src/components/MediaPlayer/ABToggle.tsx` - A/B variant toggle UI component

### Modified Files
- `src/lib/types.ts` - Added ABVariant, ABTrack, ABTrackGroup, ABParseResult interfaces
- `src/lib/store.ts` - Added isABMode, abGroup, activeVariant state + enterABMode, exitABMode, switchVariant actions
- `src/components/MediaPlayer/MediaPlayer.tsx` - Added multi-audio element support for A/B mode
- `src/components/MediaPlayer/KeyboardShortcuts.tsx` - Added A/B/C/D key handlers
- `src/components/MediaPlayer/MediaPlayerProvider.tsx` - Added A/B track detection on link click
