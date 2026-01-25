'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import PlayerControls from './PlayerControls';
import PlayerProgress from './PlayerProgress';
import PlayerVolume from './PlayerVolume';

export default function MediaPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
  } = useMediaPlayerStore();

  const mediaRef = currentTrack?.type === 'video' ? videoRef : audioRef;

  // Handle play/pause
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !currentTrack) return;

    if (isPlaying) {
      media.play().catch(console.error);
    } else {
      media.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle track change
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !currentTrack) return;

    media.src = currentTrack.url;
    media.currentTime = currentTime;
    
    if (isPlaying) {
      media.play().catch(console.error);
    }
  }, [currentTrack]);

  // Update current time
  useEffect(() => {
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
  }, []);

  const handleSeek = (time: number) => {
    const media = mediaRef.current;
    if (media) {
      media.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (!isVisible || !currentTrack) {
    return (
      <>
        <audio ref={audioRef} />
        <video ref={videoRef} style={{ display: 'none' }} />
      </>
    );
  }

  return (
    <>
      <audio ref={audioRef} />
      <video ref={videoRef} style={{ display: 'none' }} />
      
      <div className={`media-player ${isVisible ? 'visible' : ''} ${isMini ? 'media-player-mini' : ''} bg-white border-t border-gray-200 shadow-lg`}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {currentTrack.thumbnail && (
                <img 
                  src={currentTrack.thumbnail} 
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded object-cover"
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
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 max-w-md">
              <PlayerControls />
              <PlayerProgress onSeek={handleSeek} />
            </div>

            {/* Volume */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              <PlayerVolume />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
