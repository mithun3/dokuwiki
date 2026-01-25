import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaTrack, PlayerState } from '@/lib/types';

interface MediaPlayerStore extends PlayerState {
  // Actions
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
  playTrack: (track: MediaTrack, replacePlaylist?: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
}

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

      // Actions
      setCurrentTrack: (track) => set({ currentTrack: track }),
      
      setPlaylist: (tracks) => set({ playlist: tracks }),
      
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
      
      clearPlaylist: () => set({ 
        playlist: [], 
        currentIndex: 0, 
        currentTrack: null,
        isPlaying: false,
      }),
      
      setCurrentIndex: (index) => {
        const { playlist } = get();
        if (index >= 0 && index < playlist.length) {
          set({ currentIndex: index, currentTrack: playlist[index] });
        }
      },
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      
      setIsMuted: (muted) => set({ isMuted: muted }),
      
      setCurrentTime: (time) => set({ currentTime: time }),
      
      setDuration: (duration) => set({ duration }),
      
      setIsVisible: (visible) => {
        set({ isVisible: visible });
        if (typeof window !== 'undefined') {
          document.body.classList.toggle('player-active', visible);
        }
      },
      
      setIsMini: (mini) => set({ isMini: mini }),
      
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      
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
      
      togglePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        if (currentTrack) {
          set({ isPlaying: !isPlaying });
        }
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
