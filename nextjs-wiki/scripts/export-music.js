#!/usr/bin/env node
/**
 * @file scripts/export-music.js
 * @description CLI utility — copy audio files listed in a playlist to a destination directory.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 *   node scripts/export-music.js <playlist-file> <destination-dir>
 *
 * ARGUMENTS
 *   playlist-file    Path to an .m3u8 or .csv playlist export from your DJ software.
 *   destination-dir  Absolute path to the target directory.
 *                    Created automatically (with all parent directories) if it
 *                    does not exist.
 *
 * EXAMPLES
 *   node scripts/export-music.js ~/Desktop/set.m3u8 /Volumes/USB_DRIVE/Export
 *   node scripts/export-music.js ~/Desktop/tracks.csv /tmp/export_test
 *
 *   # Via the package.json shortcut (after adding to scripts):
 *   npm run export-music -- playlist.m3u8 /Volumes/USB_DRIVE/Export
 *
 * REQUIREMENTS
 *   Node.js >= 18.0.0
 *   No npm install needed — uses only built-in modules (fs, path, process).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY
 * ─────────────────────────────────────────────────────────────────────────────
 * The same path-safety rules applied by the web API route are enforced here:
 *
 *   • Null-byte injection prevention
 *   • Path traversal prevention (..)
 *   • Absolute-path requirement
 *   • System directory blocklist (/etc, /usr, C:\Windows, etc.)
 *   • Audio extension allowlist (.mp3, .m4a, .flac, .wav, .aac, .ogg, .opus)
 *
 * All filesystem operations use the Node.js `fs` module directly —
 * no shell commands are spawned, so there is no shell-injection surface.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXIT CODES
 *   0  — All files copied (or gracefully skipped as "not found")
 *   1  — One or more files FAILED to copy, OR a fatal error occurred
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allowed audio file extensions (lower-case).
 * Must stay in sync with src/lib/playlistParser.ts → AUDIO_EXTENSIONS.
 */
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.flac', '.wav', '.aac', '.ogg', '.opus'];

/**
 * Filesystem paths that must never be used as source or destination.
 * Mirrors the blocklist in src/app/api/export-music/route.ts.
 */
const BLOCKED_PATH_PREFIXES = [
  // Linux / macOS system directories
  '/etc', '/usr', '/bin', '/sbin', '/var/log', '/var/run',
  '/sys', '/proc', '/boot', '/lib', '/lib64', '/dev', '/run',
  // macOS-specific
  '/private/etc', '/private/var/log', '/System', '/Library/Preferences',
  // Windows system directories
  'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)',
];

/**
 * Regex that matches any allowed audio extension at the end of a string.
 * Case-insensitive — handles .MP3, .Flac, etc.
 */
const AUDIO_EXT_REGEX = new RegExp(
  `(${AUDIO_EXTENSIONS.map(e => e.replace('.', '\\.')).join('|')})$`,
  'i',
);

/** ANSI escape codes for coloured terminal output. */
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
};

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY: PATH VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a filesystem path against all security constraints.
 *
 * @param {string} inputPath  - The raw path string to validate
 * @param {'source'|'destination'} role  - Source paths also require an audio extension
 * @returns {{ ok: boolean, reason?: string }}
 */
function validatePath(inputPath, role) {
  if (typeof inputPath !== 'string' || !inputPath.trim()) {
    return { ok: false, reason: 'Path must be a non-empty string' };
  }

  // Guard: null bytes are used in path-injection attacks
  if (inputPath.includes('\0')) {
    return { ok: false, reason: 'Path contains null bytes' };
  }

  // Normalise: resolve '.' and '..' components
  const normalised = path.normalize(inputPath);

  // Guard: '..' remaining after normalisation means an adversarial input
  if (normalised.includes('..')) {
    return { ok: false, reason: 'Path traversal detected (..)' };
  }

  // Guard: must be absolute
  if (!path.isAbsolute(normalised)) {
    return { ok: false, reason: 'Path must be absolute' };
  }

  // Guard: must not start with a protected OS directory
  for (const blocked of BLOCKED_PATH_PREFIXES) {
    if (normalised.startsWith(blocked)) {
      return { ok: false, reason: `Blocked system directory: ${blocked}` };
    }
  }

  // Source-only: extension must be in the allowlist
  if (role === 'source') {
    const ext = path.extname(normalised).toLowerCase();
    if (!AUDIO_EXTENSIONS.includes(ext)) {
      return {
        ok: false,
        reason: `Extension "${ext}" not in allowed list: ${AUDIO_EXTENSIONS.join(', ')}`,
      };
    }
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract audio file paths from M3U8 text content.
 *
 * Rules:
 *   - Split on newlines
 *   - Skip blank lines
 *   - Skip lines starting with '#' (all M3U8 directives)
 *   - Keep lines that end with a recognised audio extension
 *
 * @param {string} text - Raw text of the .m3u8 file
 * @returns {string[]} Array of file paths (in order of appearance)
 */
function parseM3U8(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && AUDIO_EXT_REGEX.test(l));
}

/**
 * Parse one CSV row into cell values, correctly handling quoted fields.
 *
 * @param {string} row - A single row from a CSV file
 * @returns {string[]} Cell values with surrounding quotes stripped
 */
function parseCSVRow(row) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      if (row[i + 1] === quoteChar) {
        // Escaped quote (e.g. "" inside a double-quoted field)
        current += char;
        i++;
      } else {
        inQuotes = false;
      }
    } else if (!inQuotes && char === ',') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

/**
 * Determine whether a CSV cell looks like an audio file path.
 *
 * @param {string} cell - Raw cell value (may have surrounding quotes)
 * @returns {boolean}
 */
function isPathCell(cell) {
  const clean = cell.replace(/^["']|["']$/g, '').trim();
  if (!clean || !AUDIO_EXT_REGEX.test(clean)) return false;
  return (
    clean.startsWith('/') ||            // Unix absolute
    clean.startsWith('~') ||            // Tilde home
    clean.startsWith('./') ||           // Relative
    clean.startsWith('../') ||          // Relative parent
    /^[A-Za-z]:[\\\/]/.test(clean)      // Windows drive letter
  );
}

/**
 * Extract audio file paths from CSV text content.
 * Scans every cell in every row — no fixed column position required.
 *
 * @param {string} text - Raw text of the .csv file
 * @returns {string[]} Deduplicated array of file paths
 */
function parseCSV(text) {
  const seen = new Set();
  const results = [];

  for (const row of text.split(/\r?\n/)) {
    if (!row.trim()) continue;

    for (const cell of parseCSVRow(row)) {
      const clean = cell.replace(/^["']|["']$/g, '').trim();
      if (isPathCell(clean) && !seen.has(clean)) {
        seen.add(clean);
        results.push(clean);
      }
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TERMINAL OUTPUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Print a divider line to stdout.
 */
function divider() {
  console.log(`${C.grey}──────────────────────────────────────────────────${C.reset}`);
}

/**
 * Print usage instructions and exit with code 1.
 */
function printUsageAndExit() {
  console.log(`
${C.bold}Music Export CLI${C.reset}
Copies audio files from one or more playlists into per-playlist subfolders.

${C.bold}Usage:${C.reset}
  node scripts/export-music.js <destination-dir> <playlist1> [playlist2 ...]

${C.bold}Arguments:${C.reset}
  destination-dir  Root destination folder. Each playlist gets its own subfolder.
  playlist1 ...    One or more .m3u8 or .csv playlist files.

${C.bold}Destination structure:${C.reset}
  destination-dir/
    My Summer Playlist/   ← from "My Summer Playlist.m3u8"
      song1.mp3
    House Mix 2026/       ← from "House Mix 2026.csv"
      track1.mp3

${C.bold}Examples:${C.reset}
  node scripts/export-music.js /Volumes/USB/Export set.m3u8
  node scripts/export-music.js /tmp/export playlist1.m3u8 playlist2.csv

${C.bold}Via npm:${C.reset}
  npm run export-music -- /Volumes/USB/Export playlist.m3u8
`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // process.argv: [node, script.js, destDir, playlist1, playlist2, ...]
  const [, , destArg, ...playlistArgs] = process.argv;

  if (!destArg || playlistArgs.length === 0) {
    printUsageAndExit();
  }

  const destPath = path.resolve(destArg);

  // Validate destination path
  const destCheck = validatePath(destPath, 'destination');
  if (!destCheck.ok) {
    console.error(`${C.red}Error:${C.reset} Invalid destination path: ${destCheck.reason}`);
    process.exit(1);
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  console.log('');
  divider();
  console.log(`${C.bold}Music Export CLI${C.reset}`);
  divider();
  console.log(`${C.cyan}Destination:${C.reset} ${destPath}`);
  console.log(`${C.cyan}Playlists:${C.reset}   ${playlistArgs.length}`);
  console.log('');

  // ── Totals across all playlists ────────────────────────────────────────────
  let totalCopied   = 0;
  let totalSkipped  = 0;
  let totalFailed   = 0;
  let hadAnyFailure = false;

  // ── Process each playlist in order ────────────────────────────────────────
  for (const playlistArg of playlistArgs) {
    const playlistPath = path.resolve(playlistArg);
    const ext          = path.extname(playlistPath).toLowerCase();

    // Validate the playlist file
    if (!fs.existsSync(playlistPath)) {
      console.error(`${C.red}✗ Not found:${C.reset} ${playlistPath}`);
      hadAnyFailure = true;
      continue;
    }

    if (ext !== '.m3u8' && ext !== '.csv') {
      console.error(`${C.red}✗ Unsupported type "${ext}":${C.reset} ${playlistPath}`);
      hadAnyFailure = true;
      continue;
    }

    // Derive the subfolder name from the playlist filename
    // (mirrors sanitizePlaylistName() in src/lib/playlistParser.ts)
    const rawName      = path.basename(playlistPath, ext);
    const playlistName = rawName.replace(/[\/\\:*?"<>|\0]/g, '_').trim() || 'playlist';

    console.log(`${C.bold}▶ Playlist:${C.reset} ${playlistName}`);
    console.log(`  ${C.grey}${playlistPath}${C.reset}`);

    // Parse the playlist
    let text;
    try {
      text = fs.readFileSync(playlistPath, 'utf-8');
    } catch (err) {
      console.error(`  ${C.red}Cannot read:${C.reset} ${err.message}`);
      hadAnyFailure = true;
      console.log('');
      continue;
    }

    const rawPaths = ext === '.m3u8' ? parseM3U8(text) : parseCSV(text);

    if (rawPaths.length === 0) {
      console.warn(`  ${C.yellow}No audio paths found.${C.reset} Skipping.`);
      console.log('');
      continue;
    }

    console.log(`  ${C.cyan}Detected:${C.reset} ${rawPaths.length} track(s)`);

    // Security-validate each source path
    const validPaths = [];
    for (const p of rawPaths) {
      const check = validatePath(p, 'source');
      if (!check.ok) {
        console.warn(`  ${C.yellow}⚠ BLOCKED${C.reset}  ${path.basename(p)} — ${check.reason}`);
        hadAnyFailure = true;
      } else {
        validPaths.push(p);
      }
    }

    if (validPaths.length === 0) {
      console.error(`  ${C.red}All paths blocked. Skipping.${C.reset}`);
      console.log('');
      continue;
    }

    // Create the playlist subfolder: destPath/playlistName/
    const playlistDir = path.join(destPath, playlistName);
    try {
      fs.mkdirSync(playlistDir, { recursive: true });
    } catch (err) {
      console.error(`  ${C.red}Cannot create directory:${C.reset} ${err.message}`);
      hadAnyFailure = true;
      console.log('');
      continue;
    }

    console.log(`  ${C.grey}→ ${playlistDir}${C.reset}`);
    console.log('');

    // Copy files into the playlist subfolder
    let copied  = 0;
    let skipped = 0;
    let failed  = 0;

    for (const srcPath of validPaths) {
      const filename = path.basename(srcPath);
      const destFile = path.join(playlistDir, filename);

      try {
        fs.copyFileSync(srcPath, destFile);

        // Verification: confirm the file actually exists at the destination
        if (fs.existsSync(destFile)) {
          console.log(`  ${C.green}✓ Copied${C.reset}    ${filename}`);
          copied++;
        } else {
          console.log(`  ${C.red}✗ UNVERIFIED${C.reset} ${filename} (missing after copy)`);
          failed++;
          hadAnyFailure = true;
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          // Source not on this machine — skip gracefully, not a hard failure
          console.log(`  ${C.yellow}⚠ Skipped${C.reset}   ${filename} (not found on this machine)`);
          skipped++;
        } else {
          console.log(`  ${C.red}✗ Failed${C.reset}    ${filename} (${err.message})`);
          failed++;
          hadAnyFailure = true;
        }
      }
    }

    // Per-playlist summary line
    console.log('');
    process.stdout.write(`  ${C.cyan}${playlistName}:${C.reset}`);
    process.stdout.write(`  ${C.green}${copied} copied${C.reset}`);
    if (skipped > 0) process.stdout.write(`  ${C.yellow}${skipped} skipped${C.reset}`);
    if (failed  > 0) process.stdout.write(`  ${C.red}${failed} FAILED${C.reset}`);
    console.log('');
    console.log('');

    totalCopied  += copied;
    totalSkipped += skipped;
    totalFailed  += failed;
  }

  // ── Overall summary ────────────────────────────────────────────────────────
  divider();
  console.log(`${C.bold}All playlists processed.${C.reset}`);
  console.log(`  ${C.green}Total copied & verified:${C.reset}  ${totalCopied}`);
  console.log(`  ${C.yellow}Total skipped (not found):${C.reset} ${totalSkipped}`);
  console.log(`  ${C.red}Total failed:${C.reset}              ${totalFailed}`);
  divider();
  console.log('');

  // ── Zero-failure check ─────────────────────────────────────────────────────
  if (hadAnyFailure || totalFailed > 0) {
    console.error(`${C.red}⚠  Exiting with code 1 — one or more issues detected.${C.reset}`);
    process.exit(1);
  }

  console.log(`${C.green}✓  Zero failures. All ${totalCopied} file(s) copied and verified.${C.reset}`);
  process.exit(0);
}

// Run and catch any unexpected top-level errors
main().catch((err) => {
  console.error(`${C.red}Unexpected error:${C.reset}`, err.message);
  process.exit(1);
});
