'use client';

import React, { useEffect, useState } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import MediaCard from './MediaCard';
import type { MediaTrack } from '@/lib/types';

interface MediaGalleryProps {
  filter?: 'all' | 'audio' | 'video';
  className?: string;
}

export function MediaGallery({ filter = 'all', className = '' }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaTrack[]>([]);
  const { playTrack, addToPlaylist, playlist } = useMediaPlayerStore();

  useEffect(() => {
    // Scan the current page for media links
    const discoverMedia = () => {
      const mediaExtensions = /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i;
      const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      
      const discovered: MediaTrack[] = [];
      const seenUrls = new Set<string>();

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || seenUrls.has(href)) return;

        const match = href.match(mediaExtensions);
        if (!match) return;

        seenUrls.add(href);

        const extension = match[1].toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogv'].includes(extension);
        const title = link.textContent?.trim() || href.split('/').pop() || 'Unknown Track';

        const track: MediaTrack = {
          id: href, // Use URL as unique ID for discovery
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

      setMediaItems(discovered);
    };

    // Delay slightly to ensure DOM is fully rendered
    const timeout = setTimeout(discoverMedia, 100);
    return () => clearTimeout(timeout);
  }, [filter]);

  if (mediaItems.length === 0) {
    return null;
  }

  const handlePlayAll = () => {
    if (mediaItems.length === 0) return;
    playTrack(mediaItems[0], true);
    mediaItems.slice(1).forEach((track) => {
      addToPlaylist(track, 'end');
    });
  };

  const handleShuffleAll = () => {
    if (mediaItems.length === 0) return;
    const shuffled = [...mediaItems].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], true);
    shuffled.slice(1).forEach((track) => {
      addToPlaylist(track, 'end');
    });
  };

  const audioCount = mediaItems.filter((m) => m.type === 'audio').length;
  const videoCount = mediaItems.filter((m) => m.type === 'video').length;

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
            onClick={(e) => {
              e.preventDefault();
              playTrack(track, true);
            }}
          />
        ))}
      </div>
    </div>
  );
}
