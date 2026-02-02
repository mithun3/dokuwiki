'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import type { MediaTrack, ABTrackGroup } from '@/lib/types';
import { QueueConflictModal } from './QueueConflictModal';
import { parseABFilename, isSameABGroup, createABGroup } from '@/lib/abUtils';

interface MediaPlayerContextType {
  playTrack: (track: MediaTrack, replacePlaylist?: boolean) => void;
  interceptMediaLinks: () => void;
  enterABComparison: (tracks: MediaTrack[]) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  // Track pending A/B tracks for grouping
  const pendingABTracks = useRef<MediaTrack[]>([]);
  
  const {
    playTrack: storePlayTrack,
    isPlaying,
    currentTrack,
    queueConflictModal,
    openQueueConflictModal,
    closeQueueConflictModal,
    addToPlaylist,
    enterABMode,
    isABMode,
  } = useMediaPlayerStore();

  const playTrack = (track: MediaTrack, replacePlaylist = false) => {
    storePlayTrack(track, replacePlaylist);
  };

  /**
   * Enter A/B comparison mode with an array of tracks
   */
  const enterABComparison = (tracks: MediaTrack[]) => {
    const group = createABGroup(tracks);
    if (group) {
      enterABMode(group);
    }
  };

  const interceptMediaLinks = () => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Check if it's a media file
      const mediaExtensions = /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|ogv)(\?.*)?$/i;
      const match = href.match(mediaExtensions);
      
      if (match) {
        e.preventDefault();
        
        const extension = match[1].toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogv'].includes(extension);
        
        // Extract title from link text or filename
        const title = link.textContent?.trim() || href.split('/').pop() || 'Unknown Track';
        
        // Extract format
        const format = extension as 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a' | 'opus' | 'flac' | 'mp4' | 'webm' | 'ogv';
        
        const track: MediaTrack = {
          id: `${Date.now()}-${Math.random()}`,
          url: href,
          title,
          type: isVideo ? 'video' : 'audio',
          artist: link.dataset.artist,
          thumbnail: link.dataset.thumbnail,
          format,
        };
        
        // Check if this is an A/B track
        const abParsed = parseABFilename(href);
        
        if (abParsed.isABTrack && !isVideo) {
          // A/B track detected - check if we should start comparison mode
          
          // If currently playing an A/B track from same group, offer comparison
          if (currentTrack && isSameABGroup(currentTrack.url, href)) {
            // Found matching A/B pair - enter comparison mode
            const group = createABGroup([currentTrack, track]);
            if (group) {
              enterABMode(group);
              return;
            }
          }
          
          // Otherwise, treat as regular track for now
          // (Could collect pending tracks for batch comparison)
        }
        
        // Check if something is already playing
        if (isPlaying && currentTrack) {
          // Show queue conflict modal
          openQueueConflictModal(currentTrack, track);
        } else {
          playTrack(track, true);
        }
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  };

  useEffect(() => {
    const cleanup = interceptMediaLinks();
    return cleanup;
  }, [isPlaying, currentTrack, isABMode]);

  return (
    <MediaPlayerContext.Provider value={{ playTrack, interceptMediaLinks, enterABComparison }}>
      {children}
      <QueueConflictModal
        isOpen={queueConflictModal.isOpen}
        currentTrack={queueConflictModal.currentTrack}
        newTrack={queueConflictModal.newTrack || { id: '', url: '', title: '', type: 'audio', format: 'mp3' }}
        onReplace={() => {
          if (queueConflictModal.newTrack) {
            playTrack(queueConflictModal.newTrack, true);
          }
          closeQueueConflictModal();
        }}
        onPlayNext={() => {
          if (queueConflictModal.newTrack) {
            addToPlaylist(queueConflictModal.newTrack, 'next');
          }
          closeQueueConflictModal();
        }}
        onAddToQueue={() => {
          if (queueConflictModal.newTrack) {
            addToPlaylist(queueConflictModal.newTrack, 'end');
          }
          closeQueueConflictModal();
        }}
        onClose={closeQueueConflictModal}
      />
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error('useMediaPlayer must be used within MediaPlayerProvider');
  }
  return context;
}
