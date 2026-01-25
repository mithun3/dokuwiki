'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import PlayerControls from './PlayerControls';
import PlayerProgress from './PlayerProgress';
import PlayerVolume from './PlayerVolume';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { QueuePanel } from './QueuePanel';

export default function MediaPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    media.load();
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
  }, [currentTrack?.type, setCurrentTime, setDuration, playNext]);

  const handleSeek = (time: number) => {
    const media = mediaRef.current;
    if (media) {
      media.currentTime = time;
      setCurrentTime(time);
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
      
      <div className={`media-player ${isVisible ? 'visible' : ''} ${isMini ? 'media-player-mini' : ''} bg-white`}>
        {/* Video Display */}
        {isVideo && (
          <div className="w-full bg-black flex items-center justify-center" style={{ height: '270px' }}>
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
            </div>
            {/* Queue Button */}
            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition text-gray-600"
              title="Toggle queue"
            >
              📋
            </button>
          </div>

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
