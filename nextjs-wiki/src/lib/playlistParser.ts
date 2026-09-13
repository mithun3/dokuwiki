/**
 * @module playlistParser
 * @description Browser-safe utilities for parsing audio playlist files.
 *
 * Supported formats
 * ─────────────────
 *   • .m3u8  Extended M3U playlist (exported from iTunes, VirtualDJ, Traktor, Rekordbox…)
 *   • .csv   Comma-separated values with smart path auto-detection
 *            Works with Rekordbox, Serato, VirtualDJ, iTunes, and most DJ software exports.
 *
 * Browser-safety guarantee
 * ─────────────────────────
 * This module uses ONLY browser-native APIs: FileReader, String, Array.
 * It contains no Node.js imports and is safe to import in any 'use client' component.
 * The server-side API route imports AUDIO_EXTENSIONS from here to keep both in sync.
 *
 * @see RFC 8216 for the M3U8 format specification
 */

import type { ParsedTrack } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical list of supported audio file extensions (all lower-case).
 *
 * Exported so the server-side API route can import the same list instead of
 * duplicating it — the source of truth lives here, in the browser module.
 *
 * When comparing, always call `.toLowerCase()` first:
 *   path.extname(p).toLowerCase() → compare against AUDIO_EXTENSIONS
 */
export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.flac',
  '.wav',
  '.aac',
  '.ogg',
  '.opus',
] as const;

/**
 * Regex that matches any of the allowed audio extensions at the END of a string.
 * Used to quickly test whether a line or cell value ends with an audio file.
 *
 * Example matches:
 *   "/Users/me/Music/song.mp3"   ✓
 *   "track.FLAC"                 ✓  (case-insensitive)
 *   "/path/to/file.txt"          ✗
 */
const AUDIO_EXT_REGEX = new RegExp(
  `(${AUDIO_EXTENSIONS.map((e) => e.replace('.', '\\.')).join('|')})$`,
  'i',
);

// ─────────────────────────────────────────────────────────────────────────────
// PLAYLIST NAME UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a playlist filename into a safe directory name.
 *
 * This is used both in the browser (to label each ParsedTrack with its source
 * playlist) and implicitly on the server (the API route validates the name
 * independently and uses it as the destination subfolder).
 *
 * Rules applied:
 *   1. Strip the file extension (.m3u8 or .csv)
 *   2. Replace characters that are invalid in directory names on any OS
 *      (forward slash, backslash, colon, asterisk, question mark, quote,
 *      angle brackets, pipe, null byte)
 *   3. Trim leading / trailing whitespace
 *   4. Fall back to 'playlist' if the result is empty
 *
 * @param {string} filename - e.g. "My Summer Playlist.m3u8"
 * @returns {string} e.g. "My Summer Playlist"
 *
 * @example
 *   sanitizePlaylistName('House Mix 2026.m3u8')  // → 'House Mix 2026'
 *   sanitizePlaylistName('Set - 2026/07.csv')    // → 'Set - 2026_07'
 *   sanitizePlaylistName('.m3u8')                // → 'playlist'  (fallback)
 */
export function sanitizePlaylistName(filename: string): string {
  // Remove the file extension
  const withoutExt = filename.replace(/\.(m3u8|csv)$/i, '');
  // Replace characters that are forbidden in filesystem directory names
  const safe = withoutExt.replace(/[\/\\:*?"<>|\0]/g, '_').trim();
  // Fallback when the result is empty (e.g. file was named just ".m3u8")
  return safe || 'playlist';
}

// ─────────────────────────────────────────────────────────────────────────────
// M3U8 PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the raw text of an .m3u8 playlist file and extract audio file paths.
 *
 * M3U8 format recap
 * ──────────────────
 *   #EXTM3U                          ← optional header — skip
 *   #EXTINF:180,Artist - Title       ← metadata line  — skip
 *   /Users/me/Music/song.mp3         ← path line      ← KEEP
 *   #EXTINF:220,Artist2 - Track2
 *   /Volumes/USB/music/track.flac
 *
 * Rules applied:
 *   1. Split on newlines (handles both \r\n and \n)
 *   2. Skip blank lines
 *   3. Skip ALL lines starting with '#' (covers #EXTM3U, #EXTINF, #EXTGRP, etc.)
 *   4. Keep lines that end with a known audio extension
 *
 * @param {string} text - Raw text content of the .m3u8 file
 * @param {string} playlistName - Sanitized name of the source playlist file (no extension);
 *   used to tag each track so the copy layer knows which subfolder to create.
 * @returns {ParsedTrack[]} Ordered list of detected audio paths
 */
export function parseM3U8(text: string, playlistName: string): ParsedTrack[] {
  const results: ParsedTrack[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    // Skip blank lines and directive / comment lines
    if (!line || line.startsWith('#')) continue;

    // Only keep lines that actually end with an audio extension
    if (AUDIO_EXT_REGEX.test(line)) {
      results.push({
        sourcePath: line,
        filename: extractFilename(line),
        detectedFrom: 'm3u8',
        playlistName,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse one CSV row into individual cell values.
 *
 * Handles:
 *   • Fields enclosed in double or single quotes
 *   • Commas inside quoted fields  (e.g. "Title, Remix" → one cell)
 *   • Escaped quotes via doubling  (e.g. "" inside a double-quoted field)
 *
 * @param {string} row - A single row from a CSV file
 * @returns {string[]} Array of cell values (surrounding quotes already stripped)
 */
function parseCSVRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (!inQuotes && (char === '"' || char === "'")) {
      // Entering a quoted section — record which quote character opened it
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      if (row[i + 1] === quoteChar) {
        // Escaped quote (e.g. "" inside "…") — emit a single quote character
        current += char;
        i++; // Skip the second quote
      } else {
        // Closing quote
        inQuotes = false;
      }
    } else if (!inQuotes && char === ',') {
      // Field separator
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Last field (no trailing comma)
  cells.push(current.trim());
  return cells;
}

/**
 * Determine whether a CSV cell value looks like an audio file path.
 *
 * A value qualifies when it:
 *   1. Starts with a path-like prefix (/, ~/, ./, ../, or a Windows drive letter)
 *   2. Ends with a recognised audio extension
 *
 * @param {string} cell - A raw cell value (may have surrounding quotes)
 * @returns {boolean}
 */
function isPathLikeCell(cell: string): boolean {
  // Strip any remaining surrounding quotes before testing
  const clean = cell.replace(/^["']|["']$/g, '').trim();

  if (!clean) return false;

  // Extension must match
  if (!AUDIO_EXT_REGEX.test(clean)) return false;

  // Must look like a filesystem path
  return (
    clean.startsWith('/') ||             // Unix absolute:   /Users/me/song.mp3
    clean.startsWith('~') ||             // Tilde home:      ~/Music/song.mp3
    clean.startsWith('./') ||            // Relative:        ./song.mp3
    clean.startsWith('../') ||           // Relative parent: ../song.mp3
    /^[A-Za-z]:[\\\/]/.test(clean)       // Windows:         C:\Music\song.mp3
  );
}

/**
 * Parse the raw text of a .csv playlist file and extract audio file paths.
 *
 * Strategy: scan EVERY cell in EVERY row for path-like values.
 * This auto-detects the path column regardless of its position and without
 * needing a header row — it works across all common DJ software CSV formats:
 *
 *   DJ Software  | Typical path column
 *   ─────────────┼──────────────────────────────────
 *   Rekordbox    | "Location"  (varies by export)
 *   iTunes       | "Location"  (usually last column)
 *   Serato       | "Filepath"
 *   VirtualDJ    | "Filepath"  or "File Path"
 *
 * Results are deduplicated using a Set — each source path appears at most once.
 *
 * @param {string} text - Raw text content of the .csv file
 * @param {string} playlistName - Sanitized name of the source playlist file (no extension);
 *   used to tag each track with which subfolder it belongs to.
 * @returns {ParsedTrack[]} Deduplicated list of detected audio paths
 */
export function parseCSV(text: string, playlistName: string): ParsedTrack[] {
  const seen = new Set<string>();
  const results: ParsedTrack[] = [];

  for (const rawRow of text.split(/\r?\n/)) {
    if (!rawRow.trim()) continue; // Skip blank rows

    const cells = parseCSVRow(rawRow);

    for (const cell of cells) {
      // Strip surrounding quotes before path detection
      const clean = cell.replace(/^["']|["']$/g, '').trim();

      if (isPathLikeCell(clean) && !seen.has(clean)) {
        seen.add(clean);
        results.push({
          sourcePath: clean,
          filename: extractFilename(clean),
          detectedFrom: 'csv',
          playlistName,
        });
      }
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE DISPATCHER — main browser entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a browser File object and parse its contents based on the file extension.
 * This is the main entry point called by the drag-and-drop handler.
 *
 * Uses the FileReader API to read the file as UTF-8 text, then dispatches
 * to parseM3U8 or parseCSV based on the file extension.
 *
 * @param {File} file - A File object from the browser drag-and-drop or <input type="file">
 * @returns {Promise<ParsedTrack[]>} Resolves with the detected audio paths
 * @throws {Error} If the file extension is not .m3u8 or .csv
 *
 * @example
 *   const tracks = await parsePlaylistFile(droppedFile);
 *   console.log(`Found ${tracks.length} audio paths`);
 */
export function parsePlaylistFile(file: File): Promise<ParsedTrack[]> {
  return new Promise((resolve, reject) => {
    // Determine format from the file extension
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext !== 'm3u8' && ext !== 'csv') {
      reject(
        new Error(`Unsupported file type ".${ext}". Please use .m3u8 or .csv files.`),
      );
      return;
    }

    // Derive the playlist name from the filename — this becomes the destination subfolder.
    // e.g. "My Summer Playlist.m3u8" → "My Summer Playlist"
    const playlistName = sanitizePlaylistName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;

      if (typeof text !== 'string') {
        reject(new Error(`Could not read file "${file.name}" as text.`));
        return;
      }

      try {
        const tracks = ext === 'm3u8' ? parseM3U8(text, playlistName) : parseCSV(text, playlistName);
        resolve(tracks);
      } catch (err) {
        reject(
          new Error(`Failed to parse "${file.name}": ${(err as Error).message}`),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error(`FileReader error while reading "${file.name}".`));
    };

    // Read as UTF-8 — handles all common playlist file encodings
    reader.readAsText(file, 'utf-8');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract just the filename (basename) from a full filesystem path.
 * Handles both Unix (/) and Windows (\) path separators.
 *
 * @example
 *   extractFilename('/Users/me/Music/song.mp3') // → 'song.mp3'
 *   extractFilename('C:\\Music\\track.flac')    // → 'track.flac'
 *
 * @param {string} fullPath - A full filesystem path
 * @returns {string} The filename portion only
 */
function extractFilename(fullPath: string): string {
  // Normalise backslashes to forward slashes first (handles Windows paths)
  const normalised = fullPath.replace(/\\/g, '/');
  return normalised.split('/').pop() ?? fullPath;
}
