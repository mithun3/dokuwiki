'use client';

import React from 'react';
import { useMediaPlayerStore } from '@/lib/store';

export default function PlayerControls() {
  const {
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    repeatMode,
    setRepeatMode,
    isShuffled,
    toggleShuffle,
  } = useMediaPlayerStore();

  const handleRepeatClick = () => {
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Shuffle */}
      <button
        onClick={toggleShuffle}
        className={`p-2 rounded hover:bg-gray-100 transition ${isShuffled ? 'text-blue-600' : 'text-gray-600'}`}
        title="Shuffle"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l4 12h4m0 0l4-12h4m-4 12l-4 4m4-4l-4-4" />
        </svg>
      </button>

      {/* Previous */}
      <button
        onClick={playPrevious}
        className="p-2 rounded hover:bg-gray-100 transition text-gray-700"
        title="Previous"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={togglePlayPause}
        className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition text-white"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        onClick={playNext}
        className="p-2 rounded hover:bg-gray-100 transition text-gray-700"
        title="Next"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Repeat */}
      <button
        onClick={handleRepeatClick}
        className={`p-2 rounded hover:bg-gray-100 transition ${repeatMode !== 'none' ? 'text-blue-600' : 'text-gray-600'}`}
        title={`Repeat: ${repeatMode}`}
      >
        {repeatMode === 'one' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">1</text>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
      </button>
    </div>
  );
}
