import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaTrack, PlayerState } from '@/lib/types';

/**
 * Complete media player store interface
 * Manages all player state and provides actions for playback control
 * 
 * State persisted to localStorage:
 * - volume, isMuted, repeatMode, isShuffled
 * - playlist, currentIndex, currentTrack
 * 
 * Non-persisted (reset on refresh):
 * - isPlaying, currentTime (to prevent desynchronization)
 * 
 * @interface MediaPlayerStore
 * @extends {PlayerState}
 */
interface MediaPlayerStore extends PlayerState {
  queueConflictModal: {
    isOpen: boolean;
    currentTrack: MediaTrack | null;
    newTrack: MediaTrack | null;
  };
  // State setters
  setCurrentTrack: (track: MediaTrack | null) => void;
  setPlaylist: (tracks: MediaTrack[]) => void;
  addToPlaylist: (track: MediaTrack, position?: 'next' | 'end') => void;
  removeFromPlaylist: (trackId: string) => void;
  clearPlaylist: () => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsVisible: (visible: boolean) => void;
  setIsMini: (mini: boolean) => void;
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
  toggleShuffle: () => void;
  // Playback control
  playTrack: (track: MediaTrack, replacePlaylist?: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  // Queue conflict modal
  openQueueConflictModal: (currentTrack: MediaTrack, newTrack: MediaTrack) => void;
  closeQueueConflictModal: () => void;
}

/**
 * Global media player store using Zustand
 * 
 * Features:
 * - Persistent state (localStorage) for user preferences
 * - Single source of truth for all player state
 * - Automatic cleanup and bounds checking
 * - Queue conflict modal for multi-click handling
 * 
 * @type {Function} useMediaPlayerStore - Hook to access and modify player state
 * 
 * @example
 * // In a component:
 * const { currentTrack, isPlaying, playTrack } = useMediaPlayerStore();
 * 
 * @example
 * // Subscribe to specific properties:
 * const volume = useMediaPlayerStore(state => state.volume);
 * 
 * @example
 * // Call actions:
 * useMediaPlayerStore.getState().playNext();
 */
export const useMediaPlayerStore = create<MediaPlayerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      playlist: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 0.8,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      isVisible: false,
      isMini: false,
      repeatMode: 'none',
      isShuffled: false,
      queueConflictModal: {
        isOpen: false,
        currentTrack: null,
        newTrack: null,
      },

      // State setters
      /** Sets the currently playing track */
      setCurrentTrack: (track) => set({ currentTrack: track }),
      
      /** Replaces entire playlist */
      setPlaylist: (tracks) => set({ playlist: tracks }),
      
      /**
       * Adds track to playlist
       * @param {MediaTrack} track - Track to add
       * @param {'next' | 'end'} position - Where to add (default: 'end')
       */
      addToPlaylist: (track, position = 'end') => {
        const { playlist, currentIndex } = get();
        const newPlaylist = [...playlist];
        
        if (position === 'next') {
          newPlaylist.splice(currentIndex + 1, 0, track);
        } else {
          newPlaylist.push(track);
        }
        
        set({ playlist: newPlaylist });
      },
      
      /** Removes track from playlist by ID */
      removeFromPlaylist: (trackId) => {
        const { playlist, currentIndex } = get();
        const newPlaylist = playlist.filter(t => t.id !== trackId);
        const removedIndex = playlist.findIndex(t => t.id === trackId);
        
        let newIndex = currentIndex;
        if (removedIndex < currentIndex) {
          newIndex = currentIndex - 1;
        }
        
        set({ playlist: newPlaylist, currentIndex: Math.max(0, newIndex) });
      },
      
      /** Clears entire playlist and resets playback state */
      clearPlaylist: () => set({ 
        playlist: [], 
        currentIndex: 0, 
        currentTrack: null,
        isPlaying: false,
      }),
      
      /** Sets current track index (must be valid playlist index) */
      setCurrentIndex: (index) => {
        const { playlist } = get();
        if (index >= 0 && index < playlist.length) {
          set({ currentIndex: index, currentTrack: playlist[index] });
        }
      },
      
      /** Sets whether audio is currently playing */
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      /** Sets volume (0-1), automatically bounded */
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      
      /** Toggles mute state */
      setIsMuted: (muted) => set({ isMuted: muted }),
      
      /** Sets current playback time in seconds */
      setCurrentTime: (time) => set({ currentTime: time }),
      
      /** Sets total duration in seconds */
      setDuration: (duration) => set({ duration }),
      
      /** Sets player panel visibility (also updates document class) */
      setIsVisible: (visible) => {
        set({ isVisible: visible });
        if (typeof window !== 'undefined') {
          document.body.classList.toggle('player-active', visible);
        }
      },
      
      /** Toggles mini/compact player mode */
      setIsMini: (mini) => set({ isMini: mini }),
      
      /** Sets repeat mode (none/all/one) */
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      
      /** Toggles shuffle mode */
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      
      /**
       * Plays a track immediately
       * @param {MediaTrack} track - Track to play
       * @param {boolean} [replacePlaylist=false] - If true, replaces current playlist
       */
      playTrack: (track, replacePlaylist = false) => {
        const { playlist } = get();
        
        if (replacePlaylist) {
          set({
            playlist: [track],
            currentIndex: 0,
            currentTrack: track,
            isPlaying: true,
            isVisible: true,
            currentTime: 0,
          });
        } else {
          // Add to playlist if not already there
          const existingIndex = playlist.findIndex(t => t.id === track.id);
          if (existingIndex === -1) {
            const newPlaylist = [...playlist, track];
            set({
              playlist: newPlaylist,
              currentIndex: newPlaylist.length - 1,
              currentTrack: track,
              isPlaying: true,
              isVisible: true,
              currentTime: 0,
            });
          } else {
            set({
              currentIndex: existingIndex,
              currentTrack: playlist[existingIndex],
              isPlaying: true,
              isVisible: true,
              currentTime: 0,
            });
          }
        }
      },
      
      /**
       * Advances to next track
       * Respects repeat mode and shuffle settings
       */
      playNext: () => {
        const { playlist, currentIndex, repeatMode, isShuffled } = get();
        
        if (playlist.length === 0) return;
        
        if (repeatMode === 'one') {
          set({ currentTime: 0, isPlaying: true });
          return;
        }
        
        let nextIndex = currentIndex + 1;
        
        if (nextIndex >= playlist.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false });
            return;
          }
        }
        
        if (isShuffled && playlist.length > 1) {
          nextIndex = Math.floor(Math.random() * playlist.length);
          if (nextIndex === currentIndex) {
            nextIndex = (nextIndex + 1) % playlist.length;
          }
        }
        
        set({
          currentIndex: nextIndex,
          currentTrack: playlist[nextIndex],
          currentTime: 0,
          isPlaying: true,
        });
      },
      
      /**
       * Plays previous track or restarts current
       * If more than 3 seconds into track, restarts instead of skipping back
       */
      playPrevious: () => {
        const { playlist, currentIndex, currentTime } = get();
        
        if (playlist.length === 0) return;
        
        // If more than 3 seconds into track, restart current track
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
        
        set({
          currentIndex: prevIndex,
          currentTrack: playlist[prevIndex],
          currentTime: 0,
          isPlaying: true,
        });
      },
      
      /** Toggles play/pause if track is loaded */
      togglePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        if (currentTrack) {
          set({ isPlaying: !isPlaying });
        }
      },

      /** Opens modal asking how to handle queued track during active playback */
      openQueueConflictModal: (currentTrack, newTrack) => {
        set({
          queueConflictModal: {
            isOpen: true,
            currentTrack,
            newTrack,
          },
        });
      },

      /** Closes queue conflict modal */
      closeQueueConflictModal: () => {
        set({
          queueConflictModal: {
            isOpen: false,
            currentTrack: null,
            newTrack: null,
          },
        });
      },
    }),
    {
      name: 'media-player-storage',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
        playlist: state.playlist,
        currentIndex: state.currentIndex,
        currentTrack: state.currentTrack,
        // Note: isPlaying and currentTime not persisted to avoid state desync
      }),
    }
  )
);

