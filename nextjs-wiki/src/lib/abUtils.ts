/**
 * A/B Comparison Utility Functions
 * 
 * Provides helpers for detecting, parsing, and grouping A/B comparison tracks
 * based on filename conventions.
 * 
 * Naming Convention:
 * - [basename]_A.ext, [basename]_B.ext, etc.
 * - [basename]_v1.ext, [basename]_v2.ext, etc.
 * - [basename]-A.ext, [basename]-B.ext, etc.
 * 
 * @module abUtils
 */

import type { ABVariant, ABParseResult, ABTrack, ABTrackGroup, MediaTrack } from './types';

/**
 * Regex pattern to detect A/B variant suffixes in filenames
 * 
 * Matches:
 * - song_A.mp3, song_B.mp3, song_C.mp3, song_D.mp3
 * - song-A.wav, song-B.wav
 * - song_v1.mp3, song_v2.mp3, song_v3.mp3, song_v4.mp3
 * - song v1.flac, song v2.flac
 * 
 * Groups:
 * 1. Base name (everything before variant)
 * 2. Variant identifier (A/B/C/D or v1/v2/v3/v4)
 * 3. File extension
 */
const AB_PATTERN = /^(.+?)[-_\s]([ABCD]|v[1-4])\.(\w+)$/i;

/**
 * Map v1/v2/v3/v4 suffixes to A/B/C/D variants
 */
const VERSION_TO_VARIANT: Record<string, ABVariant> = {
  'v1': 'A',
  'v2': 'B',
  'v3': 'C',
  'v4': 'D',
};

/**
 * Parse a filename or URL to detect A/B variant information
 * 
 * @param {string} urlOrFilename - Full URL or filename to parse
 * @returns {ABParseResult} Parsed result with isABTrack flag and extracted metadata
 * 
 * @example
 * parseABFilename('https://cdn.example.com/piano-mix_A.mp3')
 * // { isABTrack: true, baseName: 'piano-mix', variant: 'A', extension: 'mp3' }
 * 
 * parseABFilename('https://cdn.example.com/regular-song.mp3')
 * // { isABTrack: false }
 */
export function parseABFilename(urlOrFilename: string): ABParseResult {
  // Extract filename from URL
  let filename: string;
  try {
    const url = new URL(urlOrFilename, 'http://placeholder');
    const pathname = url.pathname;
    filename = pathname.split('/').pop() || urlOrFilename;
  } catch {
    filename = urlOrFilename.split('/').pop() || urlOrFilename;
  }
  
  // Remove query parameters
  filename = filename.split('?')[0];
  
  const match = filename.match(AB_PATTERN);
  
  if (!match) {
    return { isABTrack: false };
  }
  
  const [, baseName, variantRaw, extension] = match;
  
  // Convert variant to uppercase A/B/C/D
  let variant: ABVariant;
  const upperVariant = variantRaw.toUpperCase();
  
  if (['A', 'B', 'C', 'D'].includes(upperVariant)) {
    variant = upperVariant as ABVariant;
  } else {
    // Handle v1/v2/v3/v4 format
    variant = VERSION_TO_VARIANT[variantRaw.toLowerCase()] || 'A';
  }
  
  return {
    isABTrack: true,
    baseName: baseName.trim(),
    variant,
    extension: extension.toLowerCase(),
  };
}

/**
 * Check if two tracks belong to the same A/B comparison group
 * based on their base names
 * 
 * @param {string} url1 - First track URL
 * @param {string} url2 - Second track URL
 * @returns {boolean} True if tracks are from same A/B group
 * 
 * @example
 * isSameABGroup('song_A.mp3', 'song_B.mp3') // true
 * isSameABGroup('song_A.mp3', 'other_A.mp3') // false
 */
export function isSameABGroup(url1: string, url2: string): boolean {
  const parsed1 = parseABFilename(url1);
  const parsed2 = parseABFilename(url2);
  
  if (!parsed1.isABTrack || !parsed2.isABTrack) {
    return false;
  }
  
  return (
    parsed1.baseName === parsed2.baseName &&
    parsed1.extension === parsed2.extension &&
    parsed1.variant !== parsed2.variant
  );
}

/**
 * Convert a MediaTrack to an ABTrack with variant metadata
 * 
 * @param {MediaTrack} track - Regular media track
 * @param {string} groupId - A/B group identifier
 * @returns {ABTrack | null} ABTrack if valid A/B filename, null otherwise
 */
export function convertToABTrack(track: MediaTrack, groupId: string): ABTrack | null {
  const parsed = parseABFilename(track.url);
  
  if (!parsed.isABTrack || !parsed.variant) {
    return null;
  }
  
  return {
    ...track,
    abGroupId: groupId,
    abVariant: parsed.variant,
  };
}

/**
 * Create an A/B track group from multiple media tracks
 * Validates that all tracks have matching base names and compatible durations
 * 
 * @param {MediaTrack[]} tracks - Array of 2-4 tracks to group
 * @returns {ABTrackGroup | null} Track group if valid, null otherwise
 * 
 * @example
 * createABGroup([trackA, trackB])
 * // { id: 'ab-piano-mix-123', baseName: 'piano-mix', tracks: [...] }
 */
export function createABGroup(tracks: MediaTrack[]): ABTrackGroup | null {
  if (tracks.length < 2 || tracks.length > 4) {
    return null;
  }
  
  // Parse all tracks
  const parsedTracks = tracks.map(track => ({
    track,
    parsed: parseABFilename(track.url),
  }));
  
  // Validate all are A/B tracks with same base name
  const firstParsed = parsedTracks[0].parsed;
  if (!firstParsed.isABTrack) {
    return null;
  }
  
  const baseName = firstParsed.baseName!;
  const extension = firstParsed.extension!;
  
  for (const { parsed } of parsedTracks) {
    if (!parsed.isABTrack || parsed.baseName !== baseName || parsed.extension !== extension) {
      return null;
    }
  }
  
  // Check for duplicate variants
  const variants = parsedTracks.map(p => p.parsed.variant);
  if (new Set(variants).size !== variants.length) {
    return null;
  }
  
  // Generate group ID
  const groupId = `ab-${baseName}-${Date.now()}`;
  
  // Convert to ABTracks
  const abTracks: ABTrack[] = parsedTracks
    .map(({ track, parsed }) => ({
      ...track,
      abGroupId: groupId,
      abVariant: parsed.variant!,
    }))
    .sort((a, b) => a.abVariant.localeCompare(b.abVariant));
  
  // Calculate average duration if available
  const durations = tracks.filter(t => t.duration).map(t => t.duration!);
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : undefined;
  
  return {
    id: groupId,
    baseName,
    tracks: abTracks,
    duration: avgDuration,
  };
}

/**
 * Validate that tracks in a group have compatible durations
 * Durations should be within ±5 seconds of each other
 * 
 * @param {ABTrackGroup} group - Track group to validate
 * @returns {{ valid: boolean; maxDiff: number }} Validation result
 */
export function validateABGroupDurations(group: ABTrackGroup): { valid: boolean; maxDiff: number } {
  const durations = group.tracks
    .filter(t => t.duration !== undefined)
    .map(t => t.duration!);
  
  if (durations.length < 2) {
    return { valid: true, maxDiff: 0 }; // Can't validate without durations
  }
  
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  const maxDiff = maxDuration - minDuration;
  
  // Allow ±5 seconds difference
  return {
    valid: maxDiff <= 5,
    maxDiff,
  };
}

/**
 * Get variant label for display
 * 
 * @param {ABVariant} variant - Variant identifier
 * @returns {string} Display label
 */
export function getVariantLabel(variant: ABVariant): string {
  return variant;
}

/**
 * Get all possible variants for the number of tracks
 * 
 * @param {number} trackCount - Number of tracks (2-4)
 * @returns {ABVariant[]} Array of variant identifiers
 */
export function getVariantsForCount(trackCount: number): ABVariant[] {
  const allVariants: ABVariant[] = ['A', 'B', 'C', 'D'];
  return allVariants.slice(0, Math.min(Math.max(trackCount, 2), 4));
}
