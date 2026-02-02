'use client';

import React from 'react';
import FormatBadge from './FormatBadge';
import { useMediaPlayerStore } from '@/lib/store';
import type { MediaTrack } from '@/lib/types';

interface AudioCardProps {
  /** URL to the audio file */
  url: string;
  /** Display title */
  title: string;
  /** Optional thumbnail image URL */
  thumbnail?: string;
  /** Optional artist/creator name */
  artist?: string;
  /** Optional duration string (e.g., "2:34") */
  duration?: string;
}

/**
 * AudioCard - A visual card component for single audio tracks
 * 
 * Features:
 * - Thumbnail with gradient fallback
 * - Title and artist metadata
 * - Format badge (extracted from URL)
 * - Duration display
 * - Inline "Play Now" and "Add to Queue" buttons
 * - Hover effects with play button overlay
 * 
 * @example
 * <AudioCard
 *   url="https://cdn.example.com/track.mp3"
 *   title="Clean Guitar DI"
 *   thumbnail="/images/guitar.jpg"
 *   artist="Studio Session"
 *   duration="2:34"
 * />
 */
export default function AudioCard({
  url,
  title,
  thumbnail,
  artist,
  duration,
}: AudioCardProps) {
  const { playTrack, addToPlaylist, currentTrack, isPlaying } = useMediaPlayerStore();

  // Extract format from URL
  const format = url.split('.').pop()?.toLowerCase() || 'mp3';
  
  // Check if this track is currently playing
  const isCurrentTrack = currentTrack?.url === url;
  const isThisPlaying = isCurrentTrack && isPlaying;

  const defaultThumbnail = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  const createTrack = (): MediaTrack => ({
    id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    title,
    artist,
    thumbnail,
    type: 'audio',
    format: format as MediaTrack['format'],
  });

  const handlePlayNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const track = createTrack();
    playTrack(track, true);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const track = createTrack();
    addToPlaylist(track, 'end');
  };

  return (
    <div
      className={`group relative flex w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ${
        isCurrentTrack ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Thumbnail */}
      <div
        className="relative h-28 w-28 flex-shrink-0 bg-cover bg-center"
        style={{
          backgroundImage: thumbnail ? `url('${thumbnail}')` : undefined,
          background: !thumbnail ? defaultThumbnail : undefined,
        }}
      >
        {/* Playing indicator */}
        {isThisPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex items-end gap-0.5">
              <div className="h-3 w-1 animate-pulse bg-white" style={{ animationDelay: '0ms' }} />
              <div className="h-4 w-1 animate-pulse bg-white" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-1 animate-pulse bg-white" style={{ animationDelay: '300ms' }} />
              <div className="h-5 w-1 animate-pulse bg-white" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
        )}

        {/* Audio icon */}
        <div className="absolute left-2 top-2">
          <div className="rounded-full bg-white/90 p-1.5">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-3">
        {/* Header: Title, Format, Duration */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2">{title}</h3>
            <FormatBadge format={format} type="audio" />
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            {artist && <span className="truncate">{artist}</span>}
            {artist && duration && <span>·</span>}
            {duration && <span>{duration}</span>}
          </div>
        </div>

        {/* Waveform placeholder - will be implemented later */}
        <div className="my-2 h-6 rounded bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400">▃▅▇▅▃▂▅▇▅▃▂▅▇▅▃</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePlayNow}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play Now
          </button>
          <button
            onClick={handleAddToQueue}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Queue
          </button>
        </div>
      </div>
    </div>
  );
}
