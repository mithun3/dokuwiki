'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import MediaCard from './MediaCard';
import type { MediaTrack } from '@/lib/types';

interface MediaGalleryProps {
  filter?: 'all' | 'audio' | 'video';
  className?: string;
  items?: Array<{
    url: string;
    title?: string;
    thumbnail?: string;
    artist?: string;
  }>;
}

/**
 * Media Gallery Component
 * 
 * Auto-discovers media links in page content and displays them as a gallery.
 * Includes play all and shuffle buttons.
 * 
 * Performance Optimizations:
 * - useMemo for filter calculations (audio/video counts)
 * - useCallback for handler functions (prevent unnecessary re-renders)
 * - Single setTimeout instead of multiple (reduces event loop pressure)
 * 
 * @component
 * @param {MediaGalleryProps} props
 * @returns {JSX.Element}
 */
export function MediaGallery({ filter = 'all', className = '', items = [] }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaTrack[]>([]);
  const { playTrack, addToPlaylist } = useMediaPlayerStore();

  useEffect(() => {
    const discoverMedia = () => {
      const mediaExtensions = /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i;
      const allAnchors = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];

      const discovered: MediaTrack[] = [];
      const seenUrls = new Set<string>();

      allAnchors.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || seenUrls.has(href)) return;

        const match = href.match(mediaExtensions);
        if (!match) return;

        seenUrls.add(href);

        const extension = match[1].toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogv'].includes(extension);
        
        // Try to get title from data attributes first, then fallback to text content
        const title = link.dataset.title || link.textContent?.trim() || href.split('/').pop() || 'Unknown Track';

        const track: MediaTrack = {
          id: href,
          url: href,
          title,
          type: isVideo ? 'video' : 'audio',
          artist: link.dataset.artist,
          thumbnail: link.dataset.thumbnail,
          format: extension as any,
        };

        // Apply filter
        if (filter === 'audio' && track.type === 'video') return;
        if (filter === 'video' && track.type === 'audio') return;

        discovered.push(track);
      });

      if (discovered.length > 0) {
        setMediaItems(discovered);
      }
    };

    // Single delayed scan ensures DOM is ready (consolidates 3 timeouts)
    discoverMedia();
    const timeout = setTimeout(discoverMedia, 100);

    return () => clearTimeout(timeout);
  }, [filter]);

  // Memoize counts to prevent recalculation on every render
  const { audioCount, videoCount } = useMemo(() => ({
    audioCount: mediaItems.filter((m) => m.type === 'audio').length,
    videoCount: mediaItems.filter((m) => m.type === 'video').length,
  }), [mediaItems]);

  // Memoize handlers to prevent function recreation on every render
  const handlePlayAll = useCallback(() => {
    if (mediaItems.length === 0) return;
    playTrack(mediaItems[0], true);
    mediaItems.slice(1).forEach((track) => {
      addToPlaylist(track, 'end');
    });
  }, [mediaItems, playTrack, addToPlaylist]);

  const handleShuffleAll = useCallback(() => {
    if (mediaItems.length === 0) return;
    const shuffled = [...mediaItems].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], true);
    shuffled.slice(1).forEach((track) => {
      addToPlaylist(track, 'end');
    });
  }, [mediaItems, playTrack, addToPlaylist]);

  const handleTrackClick = useCallback((track: MediaTrack) => (e: React.MouseEvent) => {
    e.preventDefault();
    playTrack(track, true);
  }, [playTrack]);

  if (mediaItems.length === 0) {
    return (
      <div className={`${className} text-center text-gray-500 py-8`}>
        <p>No {filter !== 'all' ? filter : 'media'} files found on this page.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filter & Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {mediaItems.length} track{mediaItems.length !== 1 ? 's' : ''}
          {audioCount > 0 && ` (${audioCount} audio)`}
          {videoCount > 0 && ` (${videoCount} video)`}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePlayAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <span>▶</span>
            <span>Play All</span>
          </button>

          <button
            onClick={handleShuffleAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <span>🔀</span>
            <span>Shuffle All</span>
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((track) => (
          <MediaCard
            key={track.id}
            title={track.title}
            artist={track.artist}
            thumbnail={track.thumbnail}
            format={track.format}
            type={track.type}
            url={track.url}
            onClick={handleTrackClick(track)}
          />
        ))}
      </div>
    </div>
  );
}
