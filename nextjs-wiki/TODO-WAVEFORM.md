# TODO: Waveform Visualization

## Overview

Add interactive waveform visualization to `AudioCard` and `ABComparisonCard` components. The waveform should display the audio's amplitude over time, allowing users to visually preview the content before playing.

---

## Current State

- ✅ `AudioCard` component created with waveform placeholder (`▃▅▇▅▃▂▅▇▅▃`)
- ✅ `ABComparisonCard` component created with waveform placeholder
- 🔲 No actual waveform rendering implemented

---

## Implementation Options

### Option 1: wavesurfer.js (Recommended)

**Library:** [wavesurfer.js](https://wavesurfer.xyz/)  
**Bundle Size:** ~45KB gzipped  
**Features:** Interactive, zoom, region selection, plugins

**Pros:**
- Most popular audio waveform library
- Highly customizable (colors, bar width, responsive)
- Supports seeking by clicking on waveform
- Active community and maintenance
- Plugins: spectrogram, timeline, minimap, regions

**Cons:**
- Requires loading audio to generate waveform
- Bundle size impact
- Client-side only (needs `'use client'`)

**Implementation:**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

function Waveform({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d1d5db',
      progressColor: '#3b82f6',
      cursorColor: '#1d4ed8',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 40,
      normalize: true,
    });

    wavesurferRef.current.load(url);

    return () => wavesurferRef.current?.destroy();
  }, [url]);

  return <div ref={containerRef} className="w-full" />;
}
```

### Option 2: Pre-generated Static Waveforms

**Approach:** Generate waveform images/SVGs at build time using ffmpeg or audiowaveform CLI

**Pros:**
- Zero runtime cost
- Instant display (no audio loading needed)
- Works with SSR/SSG
- Tiny file size (SVG or PNG)

**Cons:**
- Requires build pipeline setup
- Not interactive (no seeking)
- Manual regeneration when audio changes

**Tools:**
- [audiowaveform](https://github.com/bbc/audiowaveform) - BBC's waveform generator
- `ffmpeg` with waveform filter
- [peaks.js](https://github.com/bbc/peaks.js) - BBC's frontend + pre-computed data

**Build Script Example:**

```bash
#!/bin/bash
# Generate waveform JSON for peaks.js
audiowaveform -i audio.mp3 -o waveform.json --pixels-per-second 20
```

### Option 3: peaks.js (BBC)

**Library:** [peaks.js](https://github.com/bbc/peaks.js)  
**Bundle Size:** ~120KB gzipped  
**Features:** Pre-computed waveforms, zoom, segments, points

**Pros:**
- Server-side waveform pre-computation
- Handles very long audio files efficiently
- Segment and point markers
- Used by BBC for broadcast production

**Cons:**
- Larger bundle size
- Requires pre-computed waveform data
- More complex setup

### Option 4: CSS Gradient Approximation (Minimal)

**Approach:** Fake waveform using CSS gradients or SVG patterns

**Pros:**
- Zero dependencies
- Tiny (pure CSS)
- Instant display

**Cons:**
- Not real waveform data
- Purely decorative
- May mislead users

**Example:**

```tsx
function FakeWaveform() {
  return (
    <div className="h-8 w-full rounded bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200" 
         style={{
           maskImage: 'url("data:image/svg+xml,...")',
           WebkitMaskImage: 'url("data:image/svg+xml,...")',
         }}
    />
  );
}
```

---

## Recommended Approach

### Phase 1: Lazy-loaded wavesurfer.js (MVP)

1. Install wavesurfer.js: `npm install wavesurfer.js`
2. Create `<Waveform>` component with lazy loading
3. Only load waveform when card is in viewport (IntersectionObserver)
4. Only generate waveform on hover or explicit user action
5. Cache generated waveforms in memory

### Phase 2: Pre-computed Waveforms (Optimization)

1. Set up audiowaveform in CI/CD pipeline
2. Generate JSON waveform data for all audio files
3. Store in `/public/waveforms/` or CDN
4. Load pre-computed data instead of audio file

### Phase 3: Interactive Features

1. Click-to-seek on waveform
2. Show playback progress
3. Hover tooltip with timestamp
4. For A/B cards: overlay both waveforms for visual comparison

---

## Component API Design

### Single Waveform

```tsx
interface WaveformProps {
  /** Audio URL to visualize */
  url: string;
  /** Waveform height in pixels */
  height?: number;
  /** Colors */
  waveColor?: string;
  progressColor?: string;
  /** Pre-computed waveform data URL (if available) */
  peaksUrl?: string;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Current playback position (0-1) */
  progress?: number;
  /** Click handler for seeking */
  onSeek?: (position: number) => void;
  /** Loading strategy */
  loadStrategy?: 'immediate' | 'viewport' | 'hover';
}
```

### A/B Comparison Waveform

```tsx
interface ABWaveformProps {
  /** Variant A audio URL */
  urlA: string;
  /** Variant B audio URL */
  urlB: string;
  /** Active variant */
  activeVariant: 'A' | 'B';
  /** Overlay mode (show both waveforms) */
  overlay?: boolean;
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/MediaPlayer/Waveform.tsx` | Create - Main waveform component |
| `src/components/MediaPlayer/ABWaveform.tsx` | Create - A/B overlay waveform |
| `src/components/MediaPlayer/AudioCard.tsx` | Modify - Integrate Waveform |
| `src/components/MediaPlayer/ABComparisonCard.tsx` | Modify - Integrate ABWaveform |
| `package.json` | Modify - Add wavesurfer.js dependency |
| `scripts/generate-waveforms.sh` | Create (Phase 2) - Build script |

---

## Performance Considerations

1. **Lazy Loading:** Use IntersectionObserver to only load waveforms when visible
2. **Debouncing:** Don't regenerate waveforms on rapid URL changes
3. **Memory:** Destroy wavesurfer instances when components unmount
4. **Mobile:** Consider simpler waveform display on mobile (fewer bars)
5. **Caching:** Cache decoded audio data in IndexedDB for repeat views

---

## Accessibility

- Waveform should be decorative (`role="img"` with appropriate `aria-label`)
- Seek functionality should have keyboard support
- Progress indication should work with screen readers

---

## References

- [wavesurfer.js Documentation](https://wavesurfer.xyz/docs/)
- [peaks.js GitHub](https://github.com/bbc/peaks.js)
- [audiowaveform GitHub](https://github.com/bbc/audiowaveform)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

*Created: February 2026*  
*Status: 🔲 Not Started*  
*Priority: Medium*
