import { describe, it, expect, beforeEach } from 'vitest';
import { useMediaPlayerStore } from '@/lib/store';
import type { MediaTrack } from '@/lib/types';

describe('Media Player Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMediaPlayerStore.setState({
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
    });
  });

  const mockTrack: MediaTrack = {
    id: '1',
    url: 'http://example.com/audio.mp3',
    title: 'Test Track',
    artist: 'Test Artist',
    type: 'audio',
    format: 'mp3',
    duration: 180,
  };

  const mockTrack2: MediaTrack = {
    id: '2',
    url: 'http://example.com/audio2.mp3',
    title: 'Test Track 2',
    type: 'audio',
    format: 'mp3',
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useMediaPlayerStore.getState();
      expect(store.currentTrack).toBeNull();
      expect(store.playlist).toEqual([]);
      expect(store.isPlaying).toBe(false);
      expect(store.volume).toBe(0.8);
      expect(store.isMuted).toBe(false);
    });
  });

  describe('Track Management', () => {
    it('should set current track', () => {
      const store = useMediaPlayerStore.getState();
      store.setCurrentTrack(mockTrack);
      expect(useMediaPlayerStore.getState().currentTrack).toEqual(mockTrack);
    });

    it('should play track and add to playlist', () => {
      const store = useMediaPlayerStore.getState();
      store.playTrack(mockTrack);
      const state = useMediaPlayerStore.getState();
      expect(state.currentTrack).toEqual(mockTrack);
      expect(state.playlist).toContain(mockTrack);
      expect(state.isPlaying).toBe(true);
    });

    it('should replace playlist when replacePlaylist is true', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack]);
      store.playTrack(mockTrack2, true);
      const state = useMediaPlayerStore.getState();
      expect(state.playlist).toEqual([mockTrack2]);
      expect(state.currentTrack).toEqual(mockTrack2);
    });

    it('should add track to playlist at end', () => {
      const store = useMediaPlayerStore.getState();
      store.addToPlaylist(mockTrack, 'end');
      expect(useMediaPlayerStore.getState().playlist).toContain(mockTrack);
    });

    it('should add track to playlist as next', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack]);
      store.setCurrentIndex(0);
      store.addToPlaylist(mockTrack2, 'next');
      const state = useMediaPlayerStore.getState();
      expect(state.playlist[1]).toEqual(mockTrack2);
    });

    it('should remove track from playlist', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.removeFromPlaylist('1');
      const state = useMediaPlayerStore.getState();
      expect(state.playlist).not.toContain(mockTrack);
      expect(state.playlist).toContain(mockTrack2);
    });

    it('should clear playlist', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.clearPlaylist();
      const state = useMediaPlayerStore.getState();
      expect(state.playlist).toEqual([]);
      expect(state.currentTrack).toBeNull();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('Playback Control', () => {
    it('should toggle play/pause', () => {
      const store = useMediaPlayerStore.getState();
      store.setCurrentTrack(mockTrack);
      store.setIsPlaying(false);
      store.togglePlayPause();
      expect(useMediaPlayerStore.getState().isPlaying).toBe(true);
      store.togglePlayPause();
      expect(useMediaPlayerStore.getState().isPlaying).toBe(false);
    });

    it('should not toggle play/pause without track', () => {
      const store = useMediaPlayerStore.getState();
      store.setCurrentTrack(null);
      store.setIsPlaying(true);
      store.togglePlayPause();
      expect(useMediaPlayerStore.getState().isPlaying).toBe(true);
    });

    it('should play next track', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.setCurrentIndex(0);
      store.playNext();
      const state = useMediaPlayerStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.currentTrack).toEqual(mockTrack2);
    });

    it('should stop at end if repeat is none', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack]);
      store.setCurrentIndex(0);
      store.setRepeatMode('none');
      store.setIsPlaying(true);
      store.playNext();
      expect(useMediaPlayerStore.getState().isPlaying).toBe(false);
    });

    it('should loop to start if repeat is all', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.setCurrentIndex(1);
      store.setRepeatMode('all');
      store.playNext();
      const state = useMediaPlayerStore.getState();
      expect(state.currentIndex).toBe(0);
    });

    it('should repeat current track if repeat is one', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.setCurrentIndex(0);
      store.setRepeatMode('one');
      store.setCurrentTime(0);
      store.playNext();
      const state = useMediaPlayerStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.currentTime).toBe(0);
    });

    it('should play previous track', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.setCurrentIndex(1);
      store.playPrevious();
      const state = useMediaPlayerStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.currentTrack).toEqual(mockTrack);
    });

    it('should restart track if more than 3 seconds in', () => {
      const store = useMediaPlayerStore.getState();
      store.setPlaylist([mockTrack, mockTrack2]);
      store.setCurrentIndex(0);
      store.setCurrentTime(5);
      store.playPrevious();
      expect(useMediaPlayerStore.getState().currentTime).toBe(0);
    });
  });

  describe('Volume Control', () => {
    it('should set volume with bounds', () => {
      const store = useMediaPlayerStore.getState();
      store.setVolume(0.5);
      expect(useMediaPlayerStore.getState().volume).toBe(0.5);
    });

    it('should clamp volume to max 1', () => {
      const store = useMediaPlayerStore.getState();
      store.setVolume(1.5);
      expect(useMediaPlayerStore.getState().volume).toBe(1);
    });

    it('should clamp volume to min 0', () => {
      const store = useMediaPlayerStore.getState();
      store.setVolume(-0.5);
      expect(useMediaPlayerStore.getState().volume).toBe(0);
    });

    it('should toggle mute', () => {
      const store = useMediaPlayerStore.getState();
      store.setIsMuted(false);
      store.setIsMuted(true);
      expect(useMediaPlayerStore.getState().isMuted).toBe(true);
    });
  });

  describe('Queue Conflict Modal', () => {
    it('should open queue conflict modal', () => {
      const store = useMediaPlayerStore.getState();
      store.openQueueConflictModal(mockTrack, mockTrack2);
      const state = useMediaPlayerStore.getState();
      expect(state.queueConflictModal.isOpen).toBe(true);
      expect(state.queueConflictModal.currentTrack).toEqual(mockTrack);
      expect(state.queueConflictModal.newTrack).toEqual(mockTrack2);
    });

    it('should close queue conflict modal', () => {
      const store = useMediaPlayerStore.getState();
      store.openQueueConflictModal(mockTrack, mockTrack2);
      store.closeQueueConflictModal();
      const state = useMediaPlayerStore.getState();
      expect(state.queueConflictModal.isOpen).toBe(false);
      expect(state.queueConflictModal.currentTrack).toBeNull();
      expect(state.queueConflictModal.newTrack).toBeNull();
    });
  });

  describe('Shuffle', () => {
    it('should toggle shuffle', () => {
      const store = useMediaPlayerStore.getState();
      store.setIsShuffled(false);
      store.toggleShuffle();
      expect(useMediaPlayerStore.getState().isShuffled).toBe(true);
      store.toggleShuffle();
      expect(useMediaPlayerStore.getState().isShuffled).toBe(false);
    });

    it('should pick random track in shuffle mode', () => {
      const store = useMediaPlayerStore.getState();
      const tracks = [mockTrack, mockTrack2, { ...mockTrack, id: '3' }];
      store.setPlaylist(tracks);
      store.setCurrentIndex(0);
      store.toggleShuffle();
      store.playNext();
      // Just verify it changed to a different index (could be 1 or 2)
      expect(useMediaPlayerStore.getState().currentIndex).not.toBe(0);
    });
  });
});
