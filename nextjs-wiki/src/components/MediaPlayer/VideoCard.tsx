'use client';

import React from 'react';
import FormatBadge from './FormatBadge';
import { useMediaPlayerStore } from '@/lib/store';
import type { MediaTrack } from '@/lib/types';

interface VideoCardProps {
  /** URL to the video file */
  url: string;
  /** Display title */
  title: string;
  /** Optional thumbnail/poster image URL */
  thumbnail?: string;
  /** Optional creator name */
  artist?: string;
  /** Optional duration string (e.g., "2:34") */
  duration?: string;
}

/**
 * VideoCard - A visual card component for single video tracks
 * 
 * Features:
 * - Thumbnail with gradient fallback
 * - Title and creator metadata
 * - Format badge (extracted from URL)
 * - Duration display
 * - Inline "Play Now" and "Add to Queue" buttons
 * - Play button overlay on thumbnail
 * 
 * @example
 * <VideoCard
 *   url="https://cdn.example.com/video.mp4"
 *   title="Big Buck Bunny"
 *   thumbnail="/images/bunny-poster.jpg"
 *   artist="Blender Foundation"
 *   duration="9:56"
 * />
 */
export default function VideoCard({
  url,
  title,
  thumbnail,
  artist,
  duration,
}: VideoCardProps) {
  const { playTrack, addToPlaylist, currentTrack, isPlaying } = useMediaPlayerStore();

  // Extract format from URL
  const format = url.split('.').pop()?.toLowerCase() || 'mp4';
  
  // Check if this video is currently playing
  const isCurrentTrack = currentTrack?.url === url;
  const isThisPlaying = isCurrentTrack && isPlaying;

  const defaultThumbnail = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

  const createTrack = (): MediaTrack => ({
    id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    title,
    artist,
    thumbnail,
    type: 'video',
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
      className={`group relative w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ${
        isCurrentTrack ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
      }`}
    >
      {/* Thumbnail - 16:9 aspect ratio for video */}
      <div
        className="relative aspect-video w-full bg-cover bg-center"
        style={{
          backgroundImage: thumbnail ? `url('${thumbnail}')` : undefined,
          background: !thumbnail ? defaultThumbnail : undefined,
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/30" />

        {/* Playing indicator */}
        {isThisPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex items-end gap-1">
              <div className="h-4 w-1.5 animate-pulse bg-white" style={{ animationDelay: '0ms' }} />
              <div className="h-6 w-1.5 animate-pulse bg-white" style={{ animationDelay: '150ms' }} />
              <div className="h-3 w-1.5 animate-pulse bg-white" style={{ animationDelay: '300ms' }} />
              <div className="h-5 w-1.5 animate-pulse bg-white" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
        )}

        {/* Play button overlay on hover */}
        {!isThisPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <div className="ml-1 h-0 w-0 border-l-[12px] border-t-[8px] border-b-[8px] border-l-orange-600 border-t-transparent border-b-transparent" />
            </div>
          </div>
        )}

        {/* Video icon */}
        <div className="absolute left-3 top-3">
          <div className="rounded-full bg-white/90 p-2">
            <svg className="h-4 w-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        </div>

        {/* Format Badge */}
        <div className="absolute right-3 top-3">
          <FormatBadge format={format} type="video" />
        </div>

        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Artist */}
        <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2">{title}</h3>
        {artist && (
          <p className="mt-1 text-sm text-gray-500 truncate">{artist}</p>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handlePlayNow}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play Now
          </button>
          <button
            onClick={handleAddToQueue}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
