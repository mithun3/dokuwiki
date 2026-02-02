# TODO: Audio Card Further Considerations

## Overview

Outstanding design decisions and enhancements for `AudioCard` and `ABComparisonCard` components.

---

## 1. Queue Conflict Handling

**Question:** Should `AudioCard` show inline buttons (Play Now / Add to Queue) or trigger `QueueConflictModal` on click?

**Current Implementation:** Inline buttons

**Alternative:** Single click triggers modal with options:
- Replace & Play Now
- Play Next
- Add to Queue End

**Pros of Inline Buttons:**
- Faster, one-click action
- Clear intent from user
- No modal interruption

**Cons of Inline Buttons:**
- Takes up card space
- Two buttons may be confusing
- Inconsistent with MediaCard click behavior

**Recommendation:** Keep inline buttons for explicit control, but consider:
- [ ] Add option to configure default behavior
- [ ] Add "Play Next" as third button for power users
- [ ] Card click (outside buttons) could trigger modal

---

## 2. A/B Auto-Detection

**Question:** Should `ABComparisonCard` also work with auto-detection from file naming convention, or require explicit `variants` prop?

**Current Implementation:** Explicit `variants` prop required

**Alternative:** Add `autoDetect` mode:
```tsx
<ABComparisonCard
  title="Guitar Test"
  baseUrl="https://cdn.example.com/guitar-test"
  autoDetect={true}
/>
// Automatically finds guitar-test_A.mp3, guitar-test_B.mp3, etc.
```

**Pros of Explicit:**
- Clear, predictable behavior
- Works with any URL structure
- Labels are always accurate

**Cons of Explicit:**
- More verbose MDX
- Redundant if following naming convention

**Recommendation:** Start with explicit, add auto-detect later:
- [ ] Add `baseUrl` + `autoDetect` props
- [ ] Use `parseABFilename` from `abUtils.ts` for detection
- [ ] Fallback to explicit `variants` if auto-detect fails

---

## 3. Styling Consistency

**Question:** Match existing `MediaCard` styling or create distinct visual identity for new cards?

**Current Implementation:** Extended style with clear visual distinction

**AudioCard:**
- Horizontal layout (thumbnail + content side-by-side)
- Inline action buttons
- Border highlight when playing

**ABComparisonCard:**
- Purple gradient header badge ("A/B COMPARISON")
- Grid of variant thumbnails
- Keyboard hint footer

**MediaCard (existing):**
- Square aspect ratio
- Hover play overlay
- Format badge only

**Recommendation:** Keep distinct styles, but align:
- [ ] Use same border-radius (`rounded-xl`)
- [ ] Use same shadow levels (`shadow-md` → `shadow-xl` on hover)
- [ ] Use same format badge component
- [ ] Consider adding `compact` prop for consistent square cards

---

## 4. Additional Enhancements

### 4.1 Duration Display

- [ ] Extract duration from audio metadata on load
- [ ] Show loading spinner while extracting
- [ ] Cache duration in localStorage

### 4.2 Download Button

- [ ] Add optional download button to cards
- [ ] Respect content licensing settings

### 4.3 Share/Copy Link

- [ ] Add share button to copy direct audio URL
- [ ] Generate timestamped links

### 4.4 Favorites/Bookmarks

- [ ] Add heart icon to bookmark tracks
- [ ] Persist to localStorage
- [ ] Show "Favorites" section in queue panel

### 4.5 Dark Mode

- [ ] Ensure cards work in dark mode
- [ ] Use CSS variables for theming

---

## Priority Matrix

| Enhancement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Queue conflict handling config | Medium | Low | P2 |
| A/B auto-detection | Medium | Medium | P3 |
| Styling alignment | Low | Low | P3 |
| Duration display | High | Medium | P1 |
| Download button | Medium | Low | P2 |
| Share/Copy link | Low | Low | P3 |
| Favorites | Medium | High | P3 |
| Dark mode | High | Medium | P1 |

---

*Created: February 2026*  
*Status: 🔲 Backlog*
