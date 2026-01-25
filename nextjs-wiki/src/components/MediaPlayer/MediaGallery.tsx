'use client';

import React, { useEffect, useState } from 'react';
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

export function MediaGallery({ filter = 'all', className = '', items = [] }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaTrack[]>([]);
  const { playTrack, addToPlaylist, playlist } = useMediaPlayerStore();

  useEffect(() => {
    // If items were provided directly, use those
    if (items && items.length > 0) {
      const mediaExtensions = /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i;
      const discovered: MediaTrack[] = [];

      items.forEach((item) => {
        if (!item || !item.url) return;
        
        const match = item.url.match(mediaExtensions);
        if (!match) return;

        const extension = match[1].toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogv'].includes(extension);

        const track: MediaTrack = {
          id: item.url,
          url: item.url,
          title: item.title || item.url.split('/').pop() || 'Unknown Track',
          type: isVideo ? 'video' : 'audio',
          artist: item.artist,
          thumbnail: item.thumbnail,
          format: extension as any,
        };

        // Apply filter
        if (filter === 'audio' && track.type === 'video') return;
        if (filter === 'video' && track.type === 'audio') return;

        discovered.push(track);
      });

      console.log(`[MediaGallery] Processing ${items.length} items from props, discovered ${discovered.length}`);
      setMediaItems(discovered);
      return;
    }

    // Otherwise, scan the DOM for media links (fallback for backward compatibility)
    const discoverMedia = () => {
      const mediaExtensions = /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i;
      const allAnchors = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];

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
        const title = link.textContent?.trim() || href.split('/').pop() || 'Unknown Track';

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

      console.log(`[MediaGallery] DOM scan found ${discovered.length} items`);
      setMediaItems(discovered);
    };

    // Run multiple scans with delays
    discoverMedia();
    const timeout1 = setTimeout(discoverMedia, 100);
    const timeout2 = setTimeout(discoverMedia, 300);
    const timeout3 = setTimeout(discoverMedia, 700);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [filter, items]);

  if (mediaItems.length === 0) {
    return (
      <div className={`${className} text-center text-gray-500 py-8`}>
        <p>No {filter !== 'all' ? filter : 'media'} files found on this page.</p>
      </div>
    );
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
