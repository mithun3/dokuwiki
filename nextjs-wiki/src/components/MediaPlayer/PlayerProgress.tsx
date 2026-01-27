'use client';

import React from 'react';
import { useMediaPlayerStore } from '@/lib/store';

interface PlayerProgressProps {
  onSeek: (time: number) => void;
}

export default function PlayerProgress({ onSeek }: PlayerProgressProps) {
  const { currentTime, duration } = useMediaPlayerStore();

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-500 w-10 text-right">
        {formatTime(currentTime)}
      </span>
      <div 
        className="progress-bar flex-1"
        onClick={handleProgressClick}
      >
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-10">
        {formatTime(duration)}
      </span>
    </div>
  );
}
