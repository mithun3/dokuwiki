'use client';

import { useEffect } from 'react';
import { useMediaPlayerStore } from '@/lib/store';

export function KeyboardShortcuts() {
  const {
    isPlaying,
    currentTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    setVolume,
    volume,
    isMuted,
    setIsMuted,
    repeatMode,
    setRepeatMode,
    toggleShuffle,
    setCurrentTime,
    duration,
  } = useMediaPlayerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          if (currentTrack) {
            e.preventDefault();
            togglePlayPause();
          }
          break;

        case 'ArrowRight':
          if (currentTrack) {
            e.preventDefault();
            playNext();
          }
          break;

        case 'ArrowLeft':
          if (currentTrack) {
            e.preventDefault();
            playPrevious();
          }
          break;

        case 'Comma': // Volume down
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;

        case 'Period': // Volume up
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;

        case 'KeyM': // Mute
          e.preventDefault();
          setIsMuted(!isMuted);
          break;

        case 'KeyR': // Repeat cycle
          if (currentTrack) {
            e.preventDefault();
            const nextMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
            setRepeatMode(nextMode);
          }
          break;

        case 'KeyS': // Shuffle
          if (currentTrack) {
            e.preventDefault();
            toggleShuffle();
          }
          break;

        // Jump to percentage of track (0-9 keys)
        case 'Digit0':
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          if (currentTrack && duration > 0) {
            e.preventDefault();
            const digit = parseInt(e.code.replace('Digit', ''));
            const percentage = digit / 10;
            setCurrentTime(duration * percentage);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    setVolume,
    volume,
    isMuted,
    setIsMuted,
    repeatMode,
    setRepeatMode,
    toggleShuffle,
    setCurrentTime,
    duration,
  ]);

  return null; // This component only handles keyboard events
}
