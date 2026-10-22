/**
 * @file src/app/api/export-music/route.ts
 * @description POST /api/export-music
 *
 * Server-side file copy endpoint for the Music Export Tool.
 * Streams NDJSON progress events back to the client as each file is processed,
 * giving the UI a real-time determinate progress bar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY DESIGN — 8 independent layers
 * ─────────────────────────────────────────────────────────────────────────────
 * Every layer is evaluated in order. A failure in ANY layer returns a 403 or
 * 400 immediately — no filesystem work is performed until all 8 pass.
 *
 * Layer 1  — Vercel env gate
 *            Refuses if VERCEL or VERCEL_ENV env vars are present.
 *            Vercel sets these automatically; their presence proves we're in the cloud.
 *
 * Layer 2  — NODE_ENV gate
 *            Refuses if NODE_ENV === 'production' UNLESS ENABLE_MUSIC_EXPORT_TOOL=true.
 *            Prevents accidental exposure in a custom production build.
 *
 * Layer 3  — Host header
 *            The HTTP Host must be localhost, 127.0.0.1, or [::1].
 *            Rejects any external reverse-proxy or cross-host request.
 *
 * Layer 4  — Same-origin (Origin / Referer)
 *            If either header is present it must also be a localhost origin.
 *            Guards against cross-site request forgery from a page loaded elsewhere.
 *
 * Layer 5  — Body size cap
 *            Rejects batches of more than 500 source paths.
 *
 * Layer 6  — Path traversal prevention
 *            Each path is normalised with path.normalize; any remaining '..'
 *            component or embedded null byte triggers a 400.
 *
 * Layer 7  — Extension allowlist
 *            Source files must end with a known audio extension from AUDIO_EXTENSIONS.
 *
 * Layer 8  — System directory blocklist
 *            Paths inside OS-critical directories are rejected outright.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STREAMING PROTOCOL — NDJSON (newline-delimited JSON)
 * ─────────────────────────────────────────────────────────────────────────────
 * Once all security checks pass, the response body is a ReadableStream.
 * Each line is a JSON-encoded ExportProgressEvent (see src/lib/types.ts):
 *
 *   { "type": "progress", "current": 1, "total": 85, "sourcePath": "...", "success": true }
 *   { "type": "progress", "current": 2, "total": 85, "sourcePath": "...", "success": false, "error": "..." }
 *   ...
 *   { "type": "done" }
 *
 * The client splits each chunk on '\n', JSON-parses each line, and dispatches
 * state updates to the useReducer in MusicExportTool.tsx.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Import the shared audio extensions list from the browser-side parser.
// This keeps the server and client in sync from a single source of truth.
import { AUDIO_EXTENSIONS } from '@/lib/playlistParser';
import type { ExportProgressEvent } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filesystem paths that must NEVER be used as a copy source or destination.
 * Covers critical OS directories on Linux, macOS, and Windows.
 */
const BLOCKED_PATH_PREFIXES: ReadonlyArray<string> = [
  // Linux / macOS system directories
  '/etc',
  '/usr',
  '/bin',
  '/sbin',
  '/var/log',
  '/var/run',
  '/sys',
  '/proc',
  '/boot',
  '/lib',
  '/lib64',
  '/dev',
  '/run',
  // macOS-specific
  '/private/etc',
  '/private/var/log',
  '/System',
  '/Library/Preferences',
  // Windows system directories
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
];

/** Hard limit on source paths per single request. Prevents accidental DoS. */
const MAX_PATHS_PER_REQUEST = 500;

// ─────────────────────────────────────────────────────────────────────────────
// PATH VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Base path validator — applied to BOTH source files and the destination directory.
 *
 * Checks (in order):
 *   1. Must be a non-empty string
 *   2. No null bytes (path injection guard)
 *   3. Normalise with path.normalize, then re-check for '..' (traversal guard)
 *   4. Must be an absolute path
 *   5. Must not start with any BLOCKED_PATH_PREFIXES entry
 *
 * @param {string} inputPath - The raw path from the request body
 * @returns {ValidationResult}
 */
function validatePathBase(inputPath: string): ValidationResult {
  if (typeof inputPath !== 'string' || !inputPath.trim()) {
    return { ok: false, reason: 'Path must be a non-empty string' };
  }

  // Guard: null bytes are a classic path injection technique
  if (inputPath.includes('\0')) {
    return { ok: false, reason: 'Path contains null bytes (possible injection attempt)' };
  }

  // Normalise: resolves '.' and '..' components, unifies slashes
  const normalised = path.normalize(inputPath);

  // Guard: if '..' survives normalisation the input is adversarial
  if (normalised.includes('..')) {
    return { ok: false, reason: 'Path traversal detected (..)' };
  }

  // Guard: relative paths are not accepted — all paths must be absolute
  if (!path.isAbsolute(normalised)) {
    return {
      ok: false,
      reason: 'Path must be absolute (must start with / on Unix or a drive letter on Windows)',
    };
  }

  // Guard: block OS-critical directories
  for (const blocked of BLOCKED_PATH_PREFIXES) {
    if (normalised.startsWith(blocked)) {
      return {
        ok: false,
        reason: `Path points to a protected system directory: ${blocked}`,
      };
    }
  }

  return { ok: true };
}

/**
 * Validate a SOURCE audio file path.
 * Extends the base validator with an audio extension allowlist check.
 *
 * @param {string} inputPath - Path to the source audio file
 * @returns {ValidationResult}
 */
function validateSourcePath(inputPath: string): ValidationResult {
  const base = validatePathBase(inputPath);
  if (!base.ok) return base;

  const ext = path.extname(inputPath).toLowerCase();

  if (!(AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      ok: false,
      reason: `Extension "${ext}" is not in the allowed list: ${AUDIO_EXTENSIONS.join(', ')}`,
    };
  }

  return { ok: true };
}

/**
 * Validate that a playlist name is safe to use as a filesystem directory component.
 *
 * The client runs sanitizePlaylistName() before sending, so this is a
 * defence-in-depth check that catches any bypass attempts.
 *
 * Rejects:
 *   - Empty or whitespace-only strings
 *   - Any forward slash or backslash (would allow directory traversal)
 *   - The special names "." and ".."
 *   - Null bytes
 *   - Names longer than 255 characters (typical OS limit per path component)
 *
 * @param {unknown} name - Raw value from the request body
 * @returns {ValidationResult}
 */
function validatePlaylistName(name: unknown): ValidationResult {
  if (typeof name !== 'string' || !name.trim()) {
    return { ok: false, reason: 'playlistName must be a non-empty string' };
  }

  const trimmed = name.trim();

  if (trimmed.includes('\0')) {
    return { ok: false, reason: 'playlistName contains null bytes' };
  }

  // Forward slash or backslash would allow the name to act as a path component
  if (/[\/\\]/.test(trimmed)) {
    return { ok: false, reason: 'playlistName must not contain path separators (/ or \\)' };
  }

  // Prevent the two special directory names from being used
  if (trimmed === '.' || trimmed === '..') {
    return { ok: false, reason: 'playlistName must not be "." or ".."' };
  }

  // Typical OS limit for a single path component
  if (trimmed.length > 255) {
    return { ok: false, reason: 'playlistName exceeds maximum length (255 characters)' };
  }

  return { ok: true };
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/export-music
 *
 * Request body (JSON):
 *   {
 *     sourcePaths: string[];          // Array of absolute audio file paths to copy
 *     destinationDirectory: string;  // Absolute path to the target folder
 *   }
 *
 * Success response (streaming NDJSON, 200):
 *   One ExportProgressEvent JSON object per line.
 *   Stream ends with a { "type": "done" } line.
 *
 * Error responses (JSON, non-streaming):
 *   403 — security layer rejection (layers 1–4)
 *   400 — invalid request body or invalid path (layers 5–8)
 */
export async function POST(request: NextRequest): Promise<Response> {

  // ─── LAYER 1: Vercel environment gate ───────────────────────────────────────
  // Vercel injects these env vars automatically in all their environments.
  // If either is present we are NOT running locally.
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return NextResponse.json(
      {
        error: 'This endpoint is not available in hosted (Vercel) environments.',
        hint: 'Clone the repository and run `npm run dev` locally to use server-side file copy.',
      },
      { status: 403 },
    );
  }

  // ─── LAYER 2: NODE_ENV gate ─────────────────────────────────────────────────
  // Off by default in production builds. Set ENABLE_MUSIC_EXPORT_TOOL=true in
  // .env.local ONLY when you need to run a production build locally and still
  // use this tool. NEVER set it on a publicly accessible server.
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_MUSIC_EXPORT_TOOL !== 'true'
  ) {
    return NextResponse.json(
      {
        error: 'Music export is disabled in production mode.',
        hint: 'Set ENABLE_MUSIC_EXPORT_TOOL=true in .env.local to enable (localhost only).',
      },
      { status: 403 },
    );
  }

  // ─── LAYER 3: Host header validation ────────────────────────────────────────
  // The HTTP Host header must resolve to the loopback interface.
  const host = request.headers.get('host') ?? '';
  const isLocalhostHost =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]'); // IPv6 loopback

  if (!isLocalhostHost) {
    return NextResponse.json(
      { error: 'This endpoint is only accessible from localhost.' },
      { status: 403 },
    );
  }

  // ─── LAYER 4: Same-origin check (Origin / Referer) ──────────────────────────
  // If either header is present it must also point at localhost.
  // We intentionally skip this check when BOTH are absent (e.g. a direct curl request)
  // because blocking headless testing would hurt the developer experience.
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/;

  const origin = request.headers.get('origin') ?? '';
  const referer = request.headers.get('referer') ?? '';

  if (origin && !localhostPattern.test(origin)) {
    return NextResponse.json(
      { error: 'Cross-origin requests are not permitted.' },
      { status: 403 },
    );
  }

  if (referer && !localhostPattern.test(referer)) {
    return NextResponse.json(
      { error: 'Cross-origin requests are not permitted.' },
      { status: 403 },
    );
  }

  // ─── Parse request body ─────────────────────────────────────────────────────
  let body: { tracks: unknown; destinationDirectory: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const { tracks, destinationDirectory } = body;

  // ─── LAYER 5: Body size cap ─────────────────────────────────────────────────
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return NextResponse.json(
      { error: 'tracks must be a non-empty array of { sourcePath, playlistName } objects.' },
      { status: 400 },
    );
  }

  if (tracks.length > MAX_PATHS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `Too many tracks. Received ${tracks.length}, maximum is ${MAX_PATHS_PER_REQUEST}.`,
      },
      { status: 400 },
    );
  }

  if (typeof destinationDirectory !== 'string' || !destinationDirectory.trim()) {
    return NextResponse.json(
      { error: 'destinationDirectory must be a non-empty string.' },
      { status: 400 },
    );
  }

  // ─── LAYERS 6, 7, 8: Validate every track ────────────────────────────────────
  for (const track of tracks) {
    if (typeof track !== 'object' || track === null) {
      return NextResponse.json(
        { error: 'Each element in tracks must be an object with sourcePath and playlistName.' },
        { status: 400 },
      );
    }

    const { sourcePath, playlistName } = track as Record<string, unknown>;

    const pathCheck = validateSourcePath(String(sourcePath));
    if (!pathCheck.ok) {
      return NextResponse.json(
        { error: `Invalid source path "${String(sourcePath)}" — ${pathCheck.reason}` },
        { status: 400 },
      );
    }

    const nameCheck = validatePlaylistName(playlistName);
    if (!nameCheck.ok) {
      return NextResponse.json(
        { error: `Invalid playlistName "${String(playlistName)}" — ${nameCheck.reason}` },
        { status: 400 },
      );
    }
  }

  // Validate the destination directory path
  const destCheck = validatePathBase(String(destinationDirectory));
  if (!destCheck.ok) {
    return NextResponse.json(
      {
        error: `Invalid destination directory "${destinationDirectory}" — ${destCheck.reason}`,
      },
      { status: 400 },
    );
  }

  // All security layers passed — begin streaming
  type SafeTrack = { sourcePath: string; playlistName: string };
  const safeTracksArray = tracks as SafeTrack[];
  const safeDestDir = String(destinationDirectory).trim();
  const encoder = new TextEncoder();

  const encodeEvent = (event: ExportProgressEvent): Uint8Array =>
    encoder.encode(JSON.stringify(event) + '\n');

  const stream = new ReadableStream({
    async start(controller) {

      // ── Step 1: Create root destination directory ────────────────────────────
      try {
        fs.mkdirSync(safeDestDir, { recursive: true });
      } catch (err) {
        controller.enqueue(
          encodeEvent({
            type: 'error',
            message: `Failed to create destination directory: ${(err as Error).message}`,
          }),
        );
        controller.close();
        return;
      }

      // ── Step 2: Create one subfolder per unique playlist name ────────────────
      const playlistNames = new Set(safeTracksArray.map((t) => t.playlistName));

      for (const pName of playlistNames) {
        try {
          fs.mkdirSync(path.join(safeDestDir, pName), { recursive: true });
        } catch (err) {
          controller.enqueue(
            encodeEvent({
              type: 'error',
              message: `Failed to create playlist subdirectory "${pName}": ${(err as Error).message}`,
            }),
          );
          controller.close();
          return;
        }
      }

      const total = safeTracksArray.length;
      let current = 0;

      // ── Step 3: Copy each file into its playlist subfolder ───────────────────
      // Per-file error isolation: a missing/unreadable file must NOT abort the batch.
      for (const track of safeTracksArray) {
        current++;
        const filename = path.basename(track.sourcePath);
        // Destination: rootDir / playlistName / filename
        const destPath = path.join(safeDestDir, track.playlistName, filename);

        try {
          fs.copyFileSync(track.sourcePath, destPath);

          // Verification: confirm the file actually landed at the destination.
          // An existsSync after copyFileSync provides an independent, second check.
          const verified = fs.existsSync(destPath);

          controller.enqueue(
            encodeEvent({
              type: 'progress',
              current,
              total,
              sourcePath: track.sourcePath,
              playlistName: track.playlistName,
              success: true,
              verified,
              error: verified ? undefined : 'File not found at destination after copy',
            }),
          );
        } catch (err) {
          const nodeErr = err as NodeJS.ErrnoException;
          const errorMessage =
            nodeErr.code === 'ENOENT'
              ? 'File not found on this machine'
              : nodeErr.code === 'EACCES'
              ? 'Permission denied'
              : `Copy failed: ${nodeErr.message}`;

          controller.enqueue(
            encodeEvent({
              type: 'progress',
              current,
              total,
              sourcePath: track.sourcePath,
              playlistName: track.playlistName,
              success: false,
              verified: false,
              error: errorMessage,
            }),
          );
        }
      }

      // ── Step 4: Signal completion ─────────────────────────────────────────────
      controller.enqueue(encodeEvent({ type: 'done' }));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      // NDJSON content type — informs the client this is a line-delimited stream
      'Content-Type': 'application/x-ndjson',
      // Prevent any proxy or CDN from buffering the stream
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      // Prevent MIME-type sniffing
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
