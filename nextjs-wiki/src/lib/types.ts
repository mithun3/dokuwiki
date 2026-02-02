/**
 * Represents a single audio or video media file for playback
 * @interface MediaTrack
 * @property {string} id - Unique identifier for the track (typically UUID or slug)
 * @property {string} url - Absolute or relative URL to the media file
 * @property {string} title - Display title of the track
 * @property {string} [artist] - Artist or creator name
 * @property {'audio' | 'video'} type - Media type for appropriate player UI
 * @property {string} [thumbnail] - URL to album art or video thumbnail
 * @property {number} [duration] - Duration in seconds
 * @property {string} [format] - File format/codec (used for format badge display)
 */
export interface MediaTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  type: 'audio' | 'video';
  thumbnail?: string;
  duration?: number;
  format?: 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a' | 'opus' | 'flac' | 'mp4' | 'webm' | 'ogv';
}

/**
 * Complete state of the media player at any point in time
 * Managed by Zustand store and persisted to localStorage
 * @interface PlayerState
 * @property {MediaTrack | null} currentTrack - Currently playing track or null if stopped
 * @property {MediaTrack[]} playlist - All queued tracks ready to play
 * @property {number} currentIndex - Index of current track in playlist
 * @property {boolean} isPlaying - Whether audio is actively playing
 * @property {number} volume - Volume level from 0 (muted) to 1 (max)
 * @property {boolean} isMuted - Whether audio is muted (volume = 0)
 * @property {number} currentTime - Current playback position in seconds
 * @property {number} duration - Total length of current track in seconds
 * @property {boolean} isVisible - Whether player panel is visible
 * @property {boolean} isMini - Whether player is in compact/mini mode
 * @property {'none' | 'all' | 'one'} repeatMode - Repeat behavior (none/repeat all/repeat one)
 * @property {boolean} isShuffled - Whether playlist is shuffled
 */
export interface PlayerState {
  currentTrack: MediaTrack | null;
  playlist: MediaTrack[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isVisible: boolean;
  isMini: boolean;
  repeatMode: 'none' | 'all' | 'one';
  isShuffled: boolean;
}

/**
 * Action object for handling queue conflicts when attempting to play a track
 * Presented to user via QueueConflictModal for decision
 * @interface QueueAction
 * @property {'replace' | 'play-next' | 'add-to-end'} type - How to handle the new track
 *   - 'replace': Stop current track and play new one immediately
 *   - 'play-next': Keep current, queue new track after it
 *   - 'add-to-end': Add new track to end of playlist
 * @property {MediaTrack} track - The track user is attempting to play
 */
export interface QueueAction {
  type: 'replace' | 'play-next' | 'add-to-end';
  track: MediaTrack;
}

// ============================================
// A/B COMPARISON MODE TYPES
// ============================================

/**
 * Variant identifier for A/B comparison tracks
 * Supports up to 4 simultaneous comparison tracks
 */
export type ABVariant = 'A' | 'B' | 'C' | 'D';

/**
 * A single track within an A/B comparison group
 * Extends MediaTrack with variant-specific metadata
 * 
 * @interface ABTrack
 * @extends {MediaTrack}
 * @property {string} abGroupId - Unique identifier linking tracks in the same comparison group
 * @property {ABVariant} abVariant - Which variant this track represents (A, B, C, or D)
 */
export interface ABTrack extends MediaTrack {
  abGroupId: string;
  abVariant: ABVariant;
}

/**
 * A group of 2-4 tracks for A/B comparison
 * All tracks should have approximately the same duration (±5 seconds)
 * 
 * @interface ABTrackGroup
 * @property {string} id - Unique identifier for this comparison group
 * @property {string} baseName - Common name extracted from filenames (e.g., "piano-mix")
 * @property {ABTrack[]} tracks - Array of 2-4 tracks to compare
 * @property {number} [duration] - Expected duration in seconds (used for sync validation)
 */
export interface ABTrackGroup {
  id: string;
  baseName: string;
  tracks: ABTrack[];
  duration?: number;
}

/**
 * Result of parsing a filename for A/B variant detection
 * 
 * @interface ABParseResult
 * @property {boolean} isABTrack - Whether the filename matches A/B naming convention
 * @property {string} [baseName] - Common name without variant suffix
 * @property {ABVariant} [variant] - Detected variant (A, B, C, D)
 * @property {string} [extension] - File extension
 */
export interface ABParseResult {
  isABTrack: boolean;
  baseName?: string;
  variant?: ABVariant;
  extension?: string;
}

