'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import PlayerControls from './PlayerControls';
import PlayerProgress from './PlayerProgress';
import PlayerVolume from './PlayerVolume';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { QueuePanel } from './QueuePanel';
import { ABToggle, ABIndicator } from './ABToggle';
import type { ABVariant } from '@/lib/types';

/**
 * Main media player component
 * 
 * Manages audio/video playback with full controls including:
 * - Play/pause and track navigation
 * - Volume and mute control
 * - Progress seeking
 * - Queue management
 * - Keyboard shortcuts support
 * 
 * State is persisted via Zustand store to localStorage
 * 
 * @component
 * @example
 * <MediaPlayer />
 * 
 * Features:
 * - Dual audio/video support based on track type
 * - Responsive mini/full modes
 * - Intelligent track queuing with conflict detection
 * - Keyboard shortcuts (Space, arrows, etc.)
 * - Volume persistence across sessions
 * 
 * @returns {JSX.Element} Media player UI with controls
 */
export default function MediaPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // A/B Mode: Multiple audio refs for instant switching
  const abAudioRefs = useRef<Record<ABVariant, HTMLAudioElement | null>>({
    A: null,
    B: null,
    C: null,
    D: null,
  });
  
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    isVisible,
    isMini,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    playNext,
    // A/B Mode state
    isABMode,
    abGroup,
    activeVariant,
  } = useMediaPlayerStore();

  const mediaRef = currentTrack?.type === 'video' ? videoRef : audioRef;

  // ============================================
  // A/B MODE: Multi-Audio Element Management
  // ============================================
  
  // Initialize A/B audio elements when entering A/B mode
  useEffect(() => {
    if (!isABMode || !abGroup) return;
    
    // Load all tracks into their respective audio elements
    abGroup.tracks.forEach(track => {
      const audioEl = abAudioRefs.current[track.abVariant];
      if (audioEl) {
        audioEl.src = track.url;
        audioEl.load();
        audioEl.volume = isMuted ? 0 : volume;
        // Mute all except active variant
        audioEl.muted = track.abVariant !== activeVariant;
      }
    });
  }, [isABMode, abGroup]);

  // A/B Mode: Handle variant switching (mute/unmute)
  useEffect(() => {
    if (!isABMode || !abGroup) return;
    
    abGroup.tracks.forEach(track => {
      const audioEl = abAudioRefs.current[track.abVariant];
      if (audioEl) {
        // Only the active variant should be audible
        audioEl.muted = track.abVariant !== activeVariant;
      }
    });
  }, [activeVariant, isABMode, abGroup]);

  // A/B Mode: Sync all audio elements to same position
  const syncABPositions = useCallback((targetTime: number) => {
    if (!isABMode || !abGroup) return;
    
    abGroup.tracks.forEach(track => {
      const audioEl = abAudioRefs.current[track.abVariant];
      if (audioEl && Math.abs(audioEl.currentTime - targetTime) > 0.1) {
        audioEl.currentTime = targetTime;
      }
    });
  }, [isABMode, abGroup]);

  // A/B Mode: Play/pause all audio elements together
  useEffect(() => {
    if (!isABMode || !abGroup) return;
    
    abGroup.tracks.forEach(track => {
      const audioEl = abAudioRefs.current[track.abVariant];
      if (audioEl) {
        if (isPlaying) {
          audioEl.play().catch(console.error);
        } else {
          audioEl.pause();
        }
      }
    });
  }, [isPlaying, isABMode, abGroup]);

  // A/B Mode: Update time from active variant
  useEffect(() => {
    if (!isABMode || !abGroup) return;
    
    const activeAudio = abAudioRefs.current[activeVariant];
    if (!activeAudio) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(activeAudio.currentTime);
      // Keep other tracks in sync
      syncABPositions(activeAudio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(activeAudio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      syncABPositions(0);
    };
    
    activeAudio.addEventListener('timeupdate', handleTimeUpdate);
    activeAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    activeAudio.addEventListener('ended', handleEnded);
    
    return () => {
      activeAudio.removeEventListener('timeupdate', handleTimeUpdate);
      activeAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      activeAudio.removeEventListener('ended', handleEnded);
    };
  }, [isABMode, abGroup, activeVariant, setCurrentTime, setDuration, setIsPlaying, syncABPositions]);

  // A/B Mode: Volume control for all elements
  useEffect(() => {
    if (!isABMode || !abGroup) return;
    
    const effectiveVolume = isMuted ? 0 : volume;
    abGroup.tracks.forEach(track => {
      const audioEl = abAudioRefs.current[track.abVariant];
      if (audioEl) {
        audioEl.volume = effectiveVolume;
      }
    });
  }, [volume, isMuted, isABMode, abGroup]);

  // ============================================
  // REGULAR MODE: Single Audio/Video Element
  // ============================================

  // Handle play/pause (regular mode only)
  useEffect(() => {
    if (isABMode) return; // A/B mode handled separately
    
    const media = mediaRef.current;
    if (!media || !currentTrack) return;

    if (isPlaying) {
      media.play().catch(console.error);
    } else {
      media.pause();
    }
  }, [isPlaying, currentTrack, isABMode]);

  // Handle volume (regular mode only)
  useEffect(() => {
    if (isABMode) return; // A/B mode handled separately
    
    const media = mediaRef.current;
    if (!media) return;
    
    media.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, isABMode]);

  // Handle track change (regular mode only)
  useEffect(() => {
    if (isABMode) return; // A/B mode handled separately
    
    const media = mediaRef.current;
    if (!media || !currentTrack) return;

    media.src = currentTrack.url;
    media.load();
    media.currentTime = currentTime;
    
    if (isPlaying) {
      media.play().catch(console.error);
    }
  }, [currentTrack, isABMode]);

  // Update current time (regular mode only)
  useEffect(() => {
    if (isABMode) return; // A/B mode handled separately
    
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handleEnded = () => {
      playNext();
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack?.type, setCurrentTime, setDuration, playNext, isABMode]);

  const handleSeek = (time: number) => {
    if (isABMode) {
      // A/B Mode: sync all audio elements
      syncABPositions(time);
      setCurrentTime(time);
    } else {
      // Regular mode: single element
      const media = mediaRef.current;
      if (media) {
        media.currentTime = time;
        setCurrentTime(time);
      }
    }
  };

  const isVideo = currentTrack?.type === 'video';

  if (!isVisible || !currentTrack) {
    return null;
  }

  return (
    <>
      <KeyboardShortcuts />
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* A/B Mode: Multiple hidden audio elements for instant switching */}
      <audio ref={el => { abAudioRefs.current.A = el; }} style={{ display: 'none' }} />
      <audio ref={el => { abAudioRefs.current.B = el; }} style={{ display: 'none' }} />
      <audio ref={el => { abAudioRefs.current.C = el; }} style={{ display: 'none' }} />
      <audio ref={el => { abAudioRefs.current.D = el; }} style={{ display: 'none' }} />
      
      <div className={`media-player ${isVisible ? 'visible' : ''} ${isMini ? 'media-player-mini' : ''} bg-white`}>
        {/* Video Display */}
        {isVideo && (
          <div className="w-full bg-white flex items-center justify-center" style={{ height: '270px' }}>
            <video 
              ref={videoRef}
              className="w-full h-full"
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}
        {!isVideo && <video ref={videoRef} style={{ display: 'none' }} />}
        
        {/* Controls Container */}
        <div className="px-3 py-2">
          {/* Track Info */}
          <div className="flex items-center gap-2 mb-2">
            {currentTrack.thumbnail && (
              <img 
                src={currentTrack.thumbnail} 
                alt={currentTrack.title}
                className="w-10 h-10 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">
                {currentTrack.title}
              </div>
              {currentTrack.artist && (
                <div className="text-xs text-gray-500 truncate">
                  {currentTrack.artist}
                </div>
              )}
              {/* A/B Mode Indicator */}
              {isABMode && <ABIndicator />}
            </div>
            {/* Queue Button - hidden in A/B mode */}
            {!isABMode && (
              <button
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition text-gray-600"
                title="Toggle queue"
              >
                📋
              </button>
            )}
          </div>

          {/* A/B Toggle Controls */}
          {isABMode && (
            <div className="mb-2">
              <ABToggle />
            </div>
          )}

          {/* Controls & Progress */}
          <div className="mb-2">
            <PlayerControls />
            <PlayerProgress onSeek={handleSeek} />
          </div>

          {/* Volume */}
          <div className="flex items-center justify-end">
            <PlayerVolume />
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      <QueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
}
