'use client';

/**
 * @file src/components/tools/MusicExportTool.tsx
 * @description Client-side Music Export Tool component.
 *
 * Workflow this component drives
 * ──────────────────────────────
 *   Step 1  Drop one or more .m3u8 / .csv playlist files onto the drop zone.
 *           Files are read immediately in the browser using FileReader.
 *           The parser extracts every audio file path it finds.
 *
 *   Step 2  Review the detected tracks in the scrollable table.
 *           The summary badges show how many files were uploaded and how many
 *           unique audio paths were found across all of them.
 *
 *   Step 3  Enter a destination directory path and choose a script format.
 *           Then pick one of two export actions:
 *
 *           a) "Download .sh / .bat Script"
 *              Generates a self-contained shell or batch script and immediately
 *              downloads it to the user's Downloads folder.
 *              Works on any host (localhost OR Vercel).
 *
 *           b) "Copy Files via Server"
 *              Sends the track list to POST /api/export-music and streams
 *              NDJSON progress events back, updating the progress bar in real time.
 *              Only available when running `npm run dev` locally.
 *
 * State management
 * ─────────────────
 * A single `useReducer` manages all component state. This keeps every transition
 * explicit and auditable in the React DevTools — there are no scattered useState calls.
 * OS choice and destination path persist in localStorage. Source Drive is session-only.
 *
 * Streaming protocol
 * ───────────────────
 * The API route returns a ReadableStream of NDJSON lines (one JSON object per '\n').
 * This component reads chunks via response.body.getReader(), accumulates a line buffer
 * to handle partial chunks, and dispatches a reducer action per complete line.
 *
 * @prop {boolean} isLocalhost
 *   Derived by the parent server component from the HTTP `host` request header.
 *   When false, "Copy Files via Server" is disabled and a tooltip explains why.
 */

import { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ParsedTrack, CopyResult, ExportProgressEvent } from '@/lib/types';
import { parsePlaylistFile } from '@/lib/playlistParser';
import {
  generateBashScript,
  generateBatchScript,
  triggerDownload,
  getScriptFilename,
} from '@/lib/exportUtils';
import {
  normalizeWindowsDriveLetter,
  replaceWindowsDriveLetter,
} from '@/lib/pathUtils';

// ─────────────────────────────────────────────────────────────────────────────
// STATE — shape & actions
// ─────────────────────────────────────────────────────────────────────────────

interface ToolState {
  /** All unique ParsedTrack entries collected from every dropped file */
  parsedTracks: ParsedTrack[];
  /** Number of playlist files processed (shown in the "N files uploaded" badge) */
  uploadedFileCount: number;
  /**
   * Absolute path to the root destination directory.
   * This is a GLOBAL SETTING — it persists to localStorage across sessions and
  * applies to server copy and script generation in this component.
   */
  destinationPath: string;
  /**
   * Optional session-only Windows drive override.
   * Replaces only the leading drive letter in paths such as G:\\Music\\track.mp3.
   */
  sourceDrive: string;
  /**
   * When true, the destination path input is read-only.
   * Follows the "Protected Global Setting" pattern: the value is visible but
   * can only be changed after the user explicitly unlocks it.
   * Default: false (unlocked). Set to true automatically when a saved path
   * is restored from localStorage on mount.
   */
  isDestinationLocked: boolean;
  /** Target OS for script generation — persisted to localStorage */
  osChoice: 'unix' | 'windows';
  /**
   * Names of playlists that are currently included in the export.
   * Defaults to "all playlists selected" the moment tracks are parsed;
   * newly-added playlists (from later drops) are auto-selected too.
   */
  selectedPlaylists: Set<string>;
  /** Playlist name currently shown in the "tracks in this playlist" preview panel */
  activePlaylist: string | null;
  /** True while the user is dragging files over the drop zone */
  isDragging: boolean;
  /** True while FileReader is parsing one or more uploaded files */
  isParsingFiles: boolean;
  /** Non-fatal parse warning (e.g. "no paths found") — dismissible banner */
  parseError: string;
  /** Controls which sub-panel of the "Progress" section is visible */
  copyStatus: 'idle' | 'running' | 'done' | 'error';
  /** 1-based current index and total for the determinate progress bar */
  copyProgress: { current: number; total: number };
  /** Tracks that were copied successfully (accumulates as stream events arrive) */
  succeeded: CopyResult[];
  /** Tracks that failed to copy (accumulates as stream events arrive) */
  failed: CopyResult[];
  /** Top-level error message for fatal failures (security rejection, network error) */
  fatalError: string;
}

type ToolAction =
  | { type: 'SET_DRAGGING'; dragging: boolean }
  | { type: 'START_PARSING' }
  | { type: 'ADD_TRACKS'; tracks: ParsedTrack[]; fileCount: number }
  | { type: 'PARSE_ERROR'; error: string }
  | { type: 'CLEAR_PARSE_ERROR' }
  | { type: 'SET_DESTINATION'; path: string }
  | { type: 'SET_SOURCE_DRIVE'; drive: string }
  /**
   * Toggle the lock on the destination path global setting.
   * locked=true  → input becomes read-only (Protected Global Setting pattern).
   * locked=false → input becomes editable.
   */
  | { type: 'SET_DESTINATION_LOCKED'; locked: boolean }
  | { type: 'SET_OS'; os: 'unix' | 'windows' }
  | { type: 'TOGGLE_PLAYLIST_SELECTION'; playlist: string }
  | { type: 'SELECT_ALL_PLAYLISTS'; playlists: string[] }
  | { type: 'SELECT_NO_PLAYLISTS' }
  | { type: 'SET_ACTIVE_PLAYLIST'; playlist: string }
  | { type: 'START_COPY'; total: number }
  | { type: 'COPY_PROGRESS_EVENT'; result: CopyResult; current: number; total: number }
  | { type: 'COPY_DONE' }
  | { type: 'COPY_FATAL_ERROR'; error: string }
  | { type: 'RESET_COPY' };

const initialState: ToolState = {
  parsedTracks: [],
  uploadedFileCount: 0,
  destinationPath: '',
  sourceDrive: '',
  // Start unlocked. On mount, if localStorage has a saved path, lock it automatically
  // so returning users see their setting protected without any action required.
  isDestinationLocked: false,
  osChoice: 'unix',     // Overridden from localStorage after mount
  selectedPlaylists: new Set(),
  activePlaylist: null,
  isDragging: false,
  isParsingFiles: false,
  parseError: '',
  copyStatus: 'idle',
  copyProgress: { current: 0, total: 0 },
  succeeded: [],
  failed: [],
  fatalError: '',
};

/**
 * Pure reducer — all state transitions are here, zero side effects.
 * Each case handles exactly one action type.
 */
function reducer(state: ToolState, action: ToolAction): ToolState {
  switch (action.type) {

    case 'SET_DRAGGING':
      return { ...state, isDragging: action.dragging };

    case 'START_PARSING':
      return { ...state, isParsingFiles: true, parseError: '' };

    case 'ADD_TRACKS': {
      // Deduplicate: paths that already appear in the list are silently dropped.
      // This allows users to drop the same file multiple times without duplicates.
      const existing = new Set(state.parsedTracks.map((t) => t.sourcePath));
      const fresh = action.tracks.filter((t) => !existing.has(t.sourcePath));

      // New playlists default to "selected" so the export includes everything
      // by default; the user can then deselect the ones they don't want.
      const selectedPlaylists = new Set(state.selectedPlaylists);
      const freshPlaylistNames: string[] = [];
      for (const t of fresh) {
        if (!selectedPlaylists.has(t.playlistName)) {
          selectedPlaylists.add(t.playlistName);
        }
        if (!freshPlaylistNames.includes(t.playlistName)) {
          freshPlaylistNames.push(t.playlistName);
        }
      }

      return {
        ...state,
        isParsingFiles: false,
        parsedTracks: [...state.parsedTracks, ...fresh],
        uploadedFileCount: state.uploadedFileCount + action.fileCount,
        selectedPlaylists,
        // Auto-preview the first playlist encountered if nothing is active yet
        activePlaylist: state.activePlaylist ?? freshPlaylistNames[0] ?? null,
      };
    }

    case 'PARSE_ERROR':
      return { ...state, isParsingFiles: false, parseError: action.error };

    case 'CLEAR_PARSE_ERROR':
      return { ...state, parseError: '' };

    case 'SET_DESTINATION':
      return { ...state, destinationPath: action.path };

    case 'SET_SOURCE_DRIVE':
      return { ...state, sourceDrive: action.drive };

    // Protected Global Setting: toggle read-only on the destination path input
    case 'SET_DESTINATION_LOCKED':
      return { ...state, isDestinationLocked: action.locked };

    case 'SET_OS':
      return { ...state, osChoice: action.os };

    // Toggle a single playlist in/out of the export selection
    case 'TOGGLE_PLAYLIST_SELECTION': {
      const selectedPlaylists = new Set(state.selectedPlaylists);
      if (selectedPlaylists.has(action.playlist)) {
        selectedPlaylists.delete(action.playlist);
      } else {
        selectedPlaylists.add(action.playlist);
      }
      return { ...state, selectedPlaylists };
    }

    case 'SELECT_ALL_PLAYLISTS':
      return { ...state, selectedPlaylists: new Set(action.playlists) };

    case 'SELECT_NO_PLAYLISTS':
      return { ...state, selectedPlaylists: new Set() };

    // Sets which playlist's tracks are shown in the preview panel
    case 'SET_ACTIVE_PLAYLIST':
      return { ...state, activePlaylist: action.playlist };

    case 'START_COPY':
      return {
        ...state,
        copyStatus: 'running',
        copyProgress: { current: 0, total: action.total },
        succeeded: [],
        failed: [],
        fatalError: '',
      };

    case 'COPY_PROGRESS_EVENT': {
      const { result, current, total } = action;
      // A track is "succeeded" only when BOTH the copy and the verification passed.
      // If the copy worked but existsSync returned false, treat it as a failure.
      const isFullSuccess = result.success && result.verified;
      return {
        ...state,
        copyProgress: { current, total },
        succeeded: isFullSuccess ? [...state.succeeded, result] : state.succeeded,
        failed: !isFullSuccess ? [...state.failed, result] : state.failed,
      };
    }

    case 'COPY_DONE':
      // Guard: only move to 'done' if we were actually running
      return state.copyStatus === 'running'
        ? { ...state, copyStatus: 'done' }
        : state;

    case 'COPY_FATAL_ERROR':
      return { ...state, copyStatus: 'error', fatalError: action.error };

    case 'RESET_COPY':
      return {
        ...state,
        copyStatus: 'idle',
        copyProgress: { current: 0, total: 0 },
        succeeded: [],
        failed: [],
        fatalError: '',
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface MusicExportToolProps {
  /**
   * Set to true by the parent server component when it detects that the
   * incoming HTTP `host` header is localhost / 127.0.0.1.
   *
   * When false:
   *   • "Copy Files via Server" button is disabled
   *   • A tooltip explains how to enable it
   *   • Script download still works normally
   */
  isLocalhost: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MusicExportTool({ isLocalhost }: MusicExportToolProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Hidden <input type="file"> — programmatically clicked when the user clicks
   * the drop zone (so the native file-browser opens).
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // DERIVED VALUES — computed from state, used by handlers below and by JSX
  // ─────────────────────────────────────────────────────────────────────────────

  const {
    parsedTracks, uploadedFileCount, destinationPath, sourceDrive, isDestinationLocked, osChoice,
    selectedPlaylists, activePlaylist,
    isDragging, isParsingFiles, parseError,
    copyStatus, copyProgress, succeeded, failed, fatalError,
  } = state;

  /**
   * One entry per unique playlist, in first-seen order, with its track count.
   * Powers the "Select Playlists" list panel.
   */
  const playlistSummaries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of parsedTracks) {
      counts.set(t.playlistName, (counts.get(t.playlistName) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [parsedTracks]);

  /** Tracks with the session-only Windows drive override applied for display and export. */
  const effectiveTracks = useMemo(
    () => parsedTracks.map((track) => ({
      ...track,
      sourcePath: replaceWindowsDriveLetter(track.sourcePath, sourceDrive),
    })),
    [parsedTracks, sourceDrive],
  );

  const playlistSourceDrives = useMemo(() => {
    const drives = new Set<string>();
    for (const track of parsedTracks) {
      const match = track.sourcePath.match(/^([A-Za-z]):[\\/]/);
      if (match) drives.add(match[1].toUpperCase());
    }
    return [...drives];
  }, [parsedTracks]);

  const requiresSourceDriveConfirmation =
    osChoice === 'windows' && playlistSourceDrives.length > 0 && !sourceDrive;

  /** Tracks belonging to the playlist currently previewed in the "content" panel */
  const activePlaylistTracks = useMemo(
    () => (activePlaylist ? effectiveTracks.filter((t) => t.playlistName === activePlaylist) : []),
    [effectiveTracks, activePlaylist],
  );

  /**
   * Tracks that will actually be exported — every parsed track whose playlist
   * is currently checked. This is what the script download and server copy
   * operate on, NOT the full parsedTracks list.
   */
  const selectedTracks = useMemo(
    () => effectiveTracks.filter((t) => selectedPlaylists.has(t.playlistName)),
    [effectiveTracks, selectedPlaylists],
  );

  /** Percentage for the deterministic progress bar fill (0–100) */
  const progressPercent = copyProgress.total > 0
    ? Math.round((copyProgress.current / copyProgress.total) * 100)
    : 0;

  /** Whether the "Copy via Server" button should be clickable */
  const canCopyViaServer = isLocalhost && copyStatus !== 'running' && selectedTracks.length > 0;

  // ─── Restore global settings from localStorage on mount ─────────────────────────────────
  useEffect(() => {
    // ── OS choice ───────────────────────────────────────────────────────────────
    const savedOs = localStorage.getItem('music-export-os');
    if (savedOs === 'unix' || savedOs === 'windows') {
      dispatch({ type: 'SET_OS', os: savedOs });
    }

    // ── Destination path (global setting) ───────────────────────────────────────
    // If a saved destination exists, restore it AND lock it immediately.
    // This implements the "Protected Global Setting" pattern: returning users
    // see their path pre-filled and protected against accidental edits.
    const savedDest = localStorage.getItem('music-export-dest');
    if (savedDest) {
      dispatch({ type: 'SET_DESTINATION', path: savedDest });
      dispatch({ type: 'SET_DESTINATION_LOCKED', locked: true });
    }
  }, []);

  // ─── Persist OS choice to localStorage whenever the user changes it ──────────
  useEffect(() => {
    localStorage.setItem('music-export-os', state.osChoice);
  }, [state.osChoice]);
  // ─── Auto-save destination path to localStorage on every change ────────────────────
  // Saves even while unlocked so work-in-progress survives an accidental tab close.
  // Saving an empty string is intentionally skipped to avoid overwriting a
  // previously saved path with a blank on first render (before mount effect runs).
  useEffect(() => {
    if (state.destinationPath) {
      localStorage.setItem('music-export-dest', state.destinationPath);
    }
  }, [state.destinationPath]);
  // ─── File processing ──────────────────────────────────────────────────────────

  /**
   * Parse an array of dropped / selected File objects.
   *
   * Only .m3u8 and .csv files are accepted; others are silently ignored.
   * All valid files are parsed in parallel with Promise.all for speed.
   * The combined, deduplicated track list is dispatched to the reducer.
   */
  const processFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(
      (f) => f.name.endsWith('.m3u8') || f.name.endsWith('.csv'),
    );

    if (valid.length === 0) {
      dispatch({
        type: 'PARSE_ERROR',
        error: 'No supported files found. Please drop .m3u8 or .csv playlist files.',
      });
      return;
    }

    dispatch({ type: 'START_PARSING' });

    try {
      // Parse all files concurrently
      const results = await Promise.all(valid.map(parsePlaylistFile));
      const allTracks = results.flat();

      if (allTracks.length === 0) {
        dispatch({
          type: 'PARSE_ERROR',
          error:
            'No audio file paths were detected in the uploaded files. ' +
            'Make sure the files are valid .m3u8 or .csv exports from your DJ software.',
        });
        return;
      }

      dispatch({ type: 'ADD_TRACKS', tracks: allTracks, fileCount: valid.length });
    } catch (err) {
      dispatch({
        type: 'PARSE_ERROR',
        error: `Parsing failed: ${(err as Error).message}`,
      });
    }
  }, []);

  // ─── Drag-and-drop event handlers ────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dispatch({ type: 'SET_DRAGGING', dragging: true });
  }, []);

  const handleDragLeave = useCallback(() => {
    dispatch({ type: 'SET_DRAGGING', dragging: false });
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dispatch({ type: 'SET_DRAGGING', dragging: false });
      await processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles],
  );

  // ─── File input change handler (click-to-browse) ─────────────────────────────

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await processFiles(Array.from(e.target.files ?? []));
      // Reset so the same file can be re-selected later without re-opening
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFiles],
  );

  // ─── Lock / Unlock the destination global setting ──────────────────────────────────

  /**
   * Toggle the destination path between locked (read-only) and unlocked (editable).
   *
   * DESIGN PATTERN: Protected Global Setting
   * ────────────────────────────────────────────────────────────────────────
   * This pattern is widely used in settings UIs (macOS System Preferences,
   * GitHub Settings, AWS Console) to prevent users from accidentally changing
   * important configuration values.
   *
   * Behaviour:
   *   • Locked   → input is read-only; value is visible but not editable.
   *   • Unlocked → input is editable; changes auto-save to localStorage on
   *               every keystroke via the destination persistence useEffect.
   *   • Re-locking is always a single click with no data loss.
   */
  const handleToggleLock = useCallback(() => {
    dispatch({ type: 'SET_DESTINATION_LOCKED', locked: !state.isDestinationLocked });
  }, [state.isDestinationLocked]);

  // ─── Script download handler ──────────────────────────────────────────────────

  const handleDownloadScript = useCallback(() => {
    if (selectedTracks.length === 0 || requiresSourceDriveConfirmation) return;

    // Fall back to a placeholder destination if the field is empty
    const dest = state.destinationPath.trim() || '/path/to/destination';
    const filename = getScriptFilename(state.osChoice);
    const isUnix = state.osChoice === 'unix';

    const scriptContent = isUnix
      ? generateBashScript(selectedTracks, dest)
      : generateBatchScript(selectedTracks, dest);

    const mimeType = isUnix ? 'text/x-shellscript' : 'text/plain';

    triggerDownload(scriptContent, filename, mimeType);
  }, [requiresSourceDriveConfirmation, selectedTracks, state.destinationPath, state.osChoice]);

  // ─── Server copy handler — streams NDJSON progress events ────────────────────

  const handleServerCopy = useCallback(async () => {
    const dest = state.destinationPath.trim();

    if (!dest) {
      // Brief inline validation — no alert() needed because the input turns red
      dispatch({
        type: 'PARSE_ERROR',
        error: 'Please enter a destination path before copying.',
      });
      return;
    }

    dispatch({ type: 'START_COPY', total: selectedTracks.length });

    try {
      const response = await fetch('/api/export-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Each track carries its playlistName so the server knows which subfolder to use
          tracks: selectedTracks.map((t) => ({
            sourcePath: t.sourcePath,
            playlistName: t.playlistName,
          })),
          destinationDirectory: dest,
        }),
      });

      // Non-streaming error responses (security rejections, 4xx)
      if (!response.ok) {
        let message = `Server error ${response.status}`;
        try {
          const errBody = await response.json();
          message = errBody.error ?? message;
          if (errBody.hint) message += ` — ${errBody.hint}`;
        } catch {
          /* ignore parse failure */
        }
        dispatch({ type: 'COPY_FATAL_ERROR', error: message });
        return;
      }

      if (!response.body) {
        dispatch({ type: 'COPY_FATAL_ERROR', error: 'Response body is empty.' });
        return;
      }

      // ── Read the NDJSON stream line-by-line ────────────────────────────────
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      // Buffer accumulates partial lines between chunks
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append the decoded chunk to the buffer
        lineBuffer += decoder.decode(value, { stream: true });

        // Split on newlines; the last element may be an incomplete line
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? ''; // save the partial tail

        for (const line of lines) {
          if (!line.trim()) continue; // skip blank separators

          try {
            const event = JSON.parse(line) as ExportProgressEvent;

            if (event.type === 'progress') {
              dispatch({
                type: 'COPY_PROGRESS_EVENT',
                current: event.current,
                total: event.total,
                result: {
                  sourcePath: event.sourcePath,
                  playlistName: event.playlistName,
                  success: event.success,
                  verified: event.verified,
                  error: event.error,
                },
              });
            } else if (event.type === 'done') {
              dispatch({ type: 'COPY_DONE' });
            } else if (event.type === 'error') {
              dispatch({ type: 'COPY_FATAL_ERROR', error: event.message });
            }
          } catch {
            // Malformed JSON line — skip silently; don't break the whole stream
          }
        }
      }

      // Guarantee COPY_DONE even if the stream closes without an explicit 'done' event
      dispatch({ type: 'COPY_DONE' });

    } catch (err) {
      dispatch({
        type: 'COPY_FATAL_ERROR',
        error: `Network error: ${(err as Error).message}`,
      });
    }
  }, [selectedTracks, state.destinationPath]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DERIVED VALUES — computed from state for use in JSX
  // ─────────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════════════════
          GLOBAL SETTINGS — always visible, persisted across sessions
          ─────────────────────────────────────────────────────────────────────
          The destination path is a global setting for this component's server
          copy and script generation. It survives page reloads via localStorage.

          DESIGN PATTERN: Protected Global Setting
          ─────────────────────────────────────────
          The value is visible at all times, but the input is read-only by default.
          The user must explicitly click the lock toggle to unlock it for editing.
          This prevents accidental changes (the same pattern used in macOS
          System Preferences, GitHub Settings, and AWS IAM).
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        {/* Card header */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Global Settings
          </h2>
          <span className="ml-auto text-xs text-gray-400">Destination saved across sessions</span>
        </div>

        {/* ── Destination Root Path with lock / unlock toggle ─────────────── */}
        <div>
          {/* Row: label + lock toggle button */}
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="music-export-dest" className="text-sm font-medium text-gray-700">
              Destination Root Path
            </label>

            {/*
              Lock / Unlock toggle.
              Locked  (amber) → input is read-only; safe against accidental edits.
              Editing (blue)  → input is editable; changes auto-save to localStorage.
            */}
            <button
              type="button"
              onClick={handleToggleLock}
              aria-label={
                isDestinationLocked
                  ? 'Unlock destination path to edit it'
                  : 'Lock destination path to protect it from accidental changes'
              }
              className={[
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1',
                'text-xs font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                isDestinationLocked
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300'
                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-300',
              ].join(' ')}
            >
              {isDestinationLocked ? (
                <>
                  {/* Closed lock — path is protected */}
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked
                </>
              ) : (
                <>
                  {/* Open lock — path is editable */}
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Editing
                </>
              )}
            </button>
          </div>

          {/* Path input — read-only when locked */}
          <input
            id="music-export-dest"
            type="text"
            value={destinationPath}
            onChange={
              isDestinationLocked
                ? undefined
                : (e) => dispatch({ type: 'SET_DESTINATION', path: e.target.value })
            }
            readOnly={isDestinationLocked}
            placeholder="/Volumes/USB_DRIVE/MyExport"
            className={[
              'block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition',
              'focus:outline-none',
              isDestinationLocked
                ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
            ].join(' ')}
          />

          <p className="mt-1.5 text-xs text-gray-400">
            {isDestinationLocked
              ? 'Protected. Click \u201cLocked\u201d above to unlock and edit this path.'
              : 'Absolute path on this machine. Subfolder per playlist is created automatically inside it.'}
          </p>
        </div>

        {osChoice === 'windows' && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <label htmlFor="music-export-source-drive" className="text-sm font-medium text-gray-700">
              Current Source Music Drive Letter
            </label>
            <div className="mt-1.5 flex max-w-32 rounded-md shadow-sm">
              <input
                id="music-export-source-drive"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={sourceDrive}
                onChange={(event) => {
                  const input = event.target.value;
                  if (!input.trim()) {
                    dispatch({ type: 'SET_SOURCE_DRIVE', drive: '' });
                    return;
                  }

                  const drive = normalizeWindowsDriveLetter(input);
                  if (drive) dispatch({ type: 'SET_SOURCE_DRIVE', drive });
                }}
                maxLength={1}
                pattern="[A-Za-z]"
                aria-describedby="music-export-source-drive-help"
                className="block min-w-0 flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm uppercase text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                :
              </span>
            </div>
            <p id="music-export-source-drive-help" className="mt-1.5 text-xs text-gray-400">
              Enter exactly one letter for the drive containing the source music now. For example,
              enter G for G:\idm. Do not enter the destination drive.
            </p>
            {playlistSourceDrives.length > 0 && (
              <p
                role="status"
                className={[
                  'mt-2 rounded-md border px-3 py-2 text-sm font-medium',
                  sourceDrive
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800',
                ].join(' ')}
              >
                {sourceDrive
                  ? `Override active: ${playlistSourceDrives.map((drive) => `${drive}:`).join(', ')} → ${sourceDrive}:`
                  : `No override applied. Script would use ${playlistSourceDrives.map((drive) => `${drive}:`).join(', ')}. Enter the current source drive letter to enable download.`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — File Upload
          Shows: drop zone → parse error banner → summary badges → track table
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          1. Upload Playlist Files
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Drop one or more <code className="text-xs bg-gray-100 px-1 rounded">.m3u8</code> or{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">.csv</code> playlist exports from your DJ software.
          Files are read entirely in the browser — nothing is uploaded to any server.
        </p>

        {/* ── Drop Zone ──────────────────────────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop playlist files here, or click to browse"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          className={[
            'relative flex flex-col items-center justify-center',
            'rounded-lg border-2 border-dashed px-8 py-12 text-center',
            'cursor-pointer transition-colors select-none',
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
          ].join(' ')}
        >
          {/* Cloud-upload icon (inline SVG — no extra dependency) */}
          <svg
            className="mx-auto mb-3 h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>

          {isParsingFiles ? (
            <p className="text-sm font-medium text-blue-600">Parsing files…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Release to upload' : 'Drop playlist files here'}
              </p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
            </>
          )}

          {/* Hidden file input — triggered by clicking the drop zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".m3u8,.csv"
            multiple
            className="sr-only"
            onChange={handleFileInputChange}
            aria-hidden="true"
          />
        </div>

        {/* ── Parse error banner (dismissible) ───────────────────────────────── */}
        {parseError && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <span className="flex-1">{parseError}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'CLEAR_PARSE_ERROR' })}
              className="text-red-400 hover:text-red-600 font-medium leading-none"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Summary badges ───────────────────────────────────────────────────── */}
        {parsedTracks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700">
              {uploadedFileCount} file{uploadedFileCount !== 1 ? 's' : ''} uploaded
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
              {parsedTracks.length} track{parsedTracks.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        )}

        {/* ── Detected tracks table ───────────────────────────────────────────── */}
        {parsedTracks.length > 0 && (
          <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                    <th scope="col" className="py-2 pl-3 pr-2 text-left text-xs font-medium text-gray-500 w-10">
                      #
                    </th>
                    <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500">
                      Playlist
                    </th>
                    <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500">
                      Filename
                    </th>
                    <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">
                      Full Path
                    </th>
                    <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500 w-16">
                      Source
                    </th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {effectiveTracks.map((track, i) => (
                  <tr key={track.sourcePath} className="hover:bg-gray-50">
                    <td className="py-1.5 pl-3 pr-2 text-gray-400 text-xs">
                      {i + 1}
                    </td>
                    <td
                      className="py-1.5 px-2 text-blue-700 text-xs font-medium truncate max-w-[140px]"
                      title={track.playlistName}
                    >
                      {track.playlistName}
                    </td>
                    <td
                      className="py-1.5 px-2 font-medium text-gray-800 truncate max-w-[200px]"
                      title={track.filename}
                    >
                      {track.filename}
                    </td>
                    <td
                      className="py-1.5 px-2 text-gray-500 truncate max-w-[300px] hidden md:table-cell font-mono text-xs"
                      title={track.sourcePath}
                    >
                      {track.sourcePath}
                    </td>
                    <td className="py-1.5 px-2">
                      <span
                        className={[
                          'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                          track.detectedFrom === 'm3u8'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-teal-100 text-teal-700',
                        ].join(' ')}
                      >
                        .{track.detectedFrom}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Select Playlists
          Visible once tracks have been detected.

          Two panels:
            1. Playlist list — checkbox per playlist to include/exclude it from
               the export (defaults to all selected). Clicking a row (not the
               checkbox) previews that playlist's tracks in the panel below.
            2. Playlist content — read-only table of the tracks belonging to
               whichever playlist is currently selected for preview.
          ═══════════════════════════════════════════════════════════════════════ */}
      {parsedTracks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Select Playlists
            </h2>
            <span className="text-xs text-gray-400">
              {selectedPlaylists.size} of {playlistSummaries.length} selected
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Choose which playlists to include in the export. Unchecked playlists are left
            out of the generated script and the server copy. Click a playlist&apos;s name
            to preview its tracks below.
          </p>

          {/* ── Select all / none ─────────────────────────────────────────────── */}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'SELECT_ALL_PLAYLISTS',
                  playlists: playlistSummaries.map((p) => p.name),
                })
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SELECT_NO_PLAYLISTS' })}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Select None
            </button>
          </div>

          {/* ── Div 1: Playlist list (checkbox + name + track count) ──────────── */}
          <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th scope="col" className="py-2 pl-3 pr-2 text-left text-xs font-medium text-gray-500 w-10">
                    <span className="sr-only">Include</span>
                  </th>
                  <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500">
                    Playlist
                  </th>
                  <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500 w-20">
                    Tracks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {playlistSummaries.map(({ name, count }) => {
                  const isSelected = selectedPlaylists.has(name);
                  const isActive = activePlaylist === name;
                  return (
                    <tr
                      key={name}
                      onClick={() => dispatch({ type: 'SET_ACTIVE_PLAYLIST', playlist: name })}
                      aria-current={isActive ? 'true' : undefined}
                      className={[
                        'cursor-pointer hover:bg-gray-50',
                        isActive ? 'bg-blue-50' : '',
                      ].join(' ')}
                    >
                      <td className="py-1.5 pl-3 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            dispatch({ type: 'TOGGLE_PLAYLIST_SELECTION', playlist: name })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Include playlist "${name}" in the export`}
                        />
                      </td>
                      <td
                        className={[
                          'py-1.5 px-2 text-xs font-medium truncate max-w-[220px]',
                          isActive ? 'text-blue-700' : 'text-gray-800',
                        ].join(' ')}
                        title={name}
                      >
                        {name}
                      </td>
                      <td className="py-1.5 px-2 text-gray-500 text-xs">{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Div 2: Content of the currently previewed playlist ─────────────── */}
          {activePlaylist && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Tracks in &ldquo;{activePlaylist}&rdquo; ({activePlaylistTracks.length})
              </h3>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th scope="col" className="py-2 pl-3 pr-2 text-left text-xs font-medium text-gray-500 w-10">
                        #
                      </th>
                      <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500">
                        Filename
                      </th>
                      <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">
                        Full Path
                      </th>
                      <th scope="col" className="py-2 px-2 text-left text-xs font-medium text-gray-500 w-16">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {activePlaylistTracks.map((track, i) => (
                      <tr key={track.sourcePath} className="hover:bg-gray-50">
                        <td className="py-1.5 pl-3 pr-2 text-gray-400 text-xs">
                          {i + 1}
                        </td>
                        <td
                          className="py-1.5 px-2 font-medium text-gray-800 truncate max-w-[200px]"
                          title={track.filename}
                        >
                          {track.filename}
                        </td>
                        <td
                          className="py-1.5 px-2 text-gray-500 truncate max-w-[300px] hidden md:table-cell font-mono text-xs"
                          title={track.sourcePath}
                        >
                          {track.sourcePath}
                        </td>
                        <td className="py-1.5 px-2">
                          <span
                            className={[
                              'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                              track.detectedFrom === 'm3u8'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-teal-100 text-teal-700',
                            ].join(' ')}
                          >
                            .{track.detectedFrom}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — Export Options
          Visible once tracks have been detected.
          Shows: OS format toggle + action buttons.
          The destination path is set in the Global Settings card above.
          ═══════════════════════════════════════════════════════════════════════ */}
      {parsedTracks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            3. Export Options
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {selectedTracks.length > 0
              ? `Choose how to copy the ${selectedTracks.length} selected track${selectedTracks.length !== 1 ? 's' : ''} to the destination set above.`
              : 'Select at least one playlist above to enable export.'}
          </p>

          {/* ── OS toggle ──────────────────────────────────────────────────────── */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Script Format</p>
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_OS', os: 'unix' })}
                className={[
                  'px-4 py-1.5 font-medium transition',
                  osChoice === 'unix'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                Mac / Linux (.sh)
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_OS', os: 'windows' })}
                className={[
                  'px-4 py-1.5 font-medium transition border-l border-gray-300',
                  osChoice === 'windows'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                Windows (.bat)
              </button>
            </div>
          </div>

          {/* ── Action buttons ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 items-center">

            {/* Button 1: Download script (always available — works on Vercel too) */}
            <button
              type="button"
              onClick={selectedTracks.length > 0 && !requiresSourceDriveConfirmation ? handleDownloadScript : undefined}
              disabled={selectedTracks.length === 0 || requiresSourceDriveConfirmation}
              aria-disabled={selectedTracks.length === 0 || requiresSourceDriveConfirmation}
              className={[
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                selectedTracks.length > 0 && !requiresSourceDriveConfirmation
                  ? 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              ].join(' ')}
            >
              {/* Download arrow icon */}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {osChoice === 'unix' ? '.sh' : '.bat'} Script
            </button>

            {requiresSourceDriveConfirmation && (
              <span className="text-xs font-medium text-red-700">
                Enter the current source drive letter above to enable download.
              </span>
            )}

            {/* Button 2: Copy via server (localhost only) */}
            {/*
              When not on localhost: wrap in a "group" div so the tooltip appears
              on hover. The button itself is rendered disabled.
            */}
            <div className={isLocalhost ? undefined : 'group relative inline-block'}>
              <button
                type="button"
                onClick={canCopyViaServer ? handleServerCopy : undefined}
                disabled={!canCopyViaServer}
                aria-disabled={!canCopyViaServer}
                className={[
                  'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 transition',
                  canCopyViaServer
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                {copyStatus === 'running' ? (
                  <>
                    {/* Spinner */}
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Copying…
                  </>
                ) : (
                  <>
                    {/* Copy-files icon */}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Files via Server
                  </>
                )}
              </button>

              {/* Tooltip — only rendered when button is disabled */}
              {!isLocalhost && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  Requires <code>npm run dev</code> running locally
                </div>
              )}
            </div>
          </div>

          {/* ── Standalone HTML link ────────────────────────────────────────────── */}
          <p className="mt-4 text-xs text-gray-400">
            Prefer no server at all?{' '}
            <a
              href="/music-export-standalone.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Open the standalone browser tool
            </a>
            {' '}(uses the browser&apos;s File System Access API to copy files without any server).
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 — Progress & Results
          Visible only after a server copy has been started.
          Shows: progress bar → results (succeeded / failed lists) → error banner.
          ═══════════════════════════════════════════════════════════════════════ */}
      {copyStatus !== 'idle' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">4. Progress</h2>
            {copyStatus !== 'running' && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET_COPY' })}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* ── Running: determinate progress bar ─────────────────────────────── */}
          {copyStatus === 'running' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>
                  Copying {copyProgress.current} of {copyProgress.total} files…
                </span>
                <span>{progressPercent}%</span>
              </div>
              {/* Progress track + fill */}
              <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-200 ease-out"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              {/* Running tally beneath the bar */}
              {(succeeded.length > 0 || failed.length > 0) && (
                <p className="mt-2 text-xs text-gray-400">
                  {succeeded.length} copied · {failed.length} failed so far
                </p>
              )}
            </div>
          )}

          {/* ── Error: fatal / security rejection ─────────────────────────────── */}
          {copyStatus === 'error' && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <span className="font-semibold">Error: </span>
              {fatalError}
            </div>
          )}

          {/* ── Done: full results panel ───────────────────────────────────────── */}
          {copyStatus === 'done' && (
            <div className="space-y-4">

              {/* Summary row */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
                  {/* Check icon */}
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {succeeded.length} copied
                </span>

                {failed.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-700">
                    {/* X icon */}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {failed.length} missing / failed
                  </span>
                )}
              </div>

              {/* Success summary grouped by playlist */}
              {succeeded.length > 0 && (() => {
                // Group succeeded results by playlist name for a per-playlist breakdown
                const byPlaylist = succeeded.reduce<Record<string, number>>(
                  (acc, r) => { acc[r.playlistName] = (acc[r.playlistName] ?? 0) + 1; return acc; },
                  {},
                );
                return (
                  <div className="text-sm text-green-700 space-y-0.5">
                    {Object.entries(byPlaylist).map(([playlist, count]) => (
                      <p key={playlist}>
                        ✓{' '}
                        <span className="font-medium">{playlist}</span>
                        {' — '}
                        {count} file{count !== 1 ? 's' : ''} copied & verified to{' '}
                        <code className="bg-green-100 px-1 rounded text-xs">
                          {destinationPath}/{playlist}
                        </code>
                      </p>
                    ))}
                  </div>
                );
              })()}

              {/* Missing / failed file list */}
              {failed.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-700 mb-2">
                    Missing, Failed, or Unverified Files ({failed.length})
                  </h3>
                  <ul className="space-y-1 max-h-48 overflow-y-auto rounded border border-red-100 bg-red-50 p-2">
                    {failed.map((r, i) => (
                      <li key={i} className="text-xs text-red-700 break-all">
                        <span className="text-red-400 font-medium mr-1">[{r.playlistName}]</span>
                        <span className="font-mono">{r.sourcePath}</span>
                        {r.error && (
                          <span className="text-red-400 ml-2">— {r.error}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-400">
                    Tip: run the downloaded script on the machine where these files exist,
                    or use the standalone browser tool to pick files manually.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
