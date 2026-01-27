'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import FormatBadge from './FormatBadge';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const {
    playlist,
    currentIndex,
    currentTrack,
    setCurrentIndex,
    removeFromPlaylist,
    clearPlaylist,
  } = useMediaPlayerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scroll current item into view
  useEffect(() => {
    if (currentItemRef.current && containerRef.current && isOpen) {
      currentItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isOpen, currentIndex]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-30"
        onClick={onClose}
      />

      {/* Queue Panel */}
      <div
        ref={containerRef}
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-lg z-40 flex flex-col animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Queue
            </h2>
            <p className="text-sm text-gray-500">
              {playlist.length} track{playlist.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {playlist.length > 0 && (
              <button
                onClick={() => clearPlaylist()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Clear queue"
              >
                🗑️
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              aria-label="Close queue"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto">
          {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg">📭</p>
              <p className="mt-2">Queue is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {playlist.map((track, index) => {
                const isCurrentTrack = index === currentIndex;
                const isPastTrack = index < currentIndex;

                return (
                  <div
                    key={`${track.id}-${index}`}
                    ref={isCurrentTrack ? currentItemRef : undefined}
                    onClick={() => setCurrentIndex(index)}
                    className={`p-3 cursor-pointer transition-colors flex items-start gap-3 group ${
                      isCurrentTrack
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : isPastTrack
                        ? 'bg-gray-50 opacity-50 hover:opacity-75'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Index or Playing Indicator */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {isCurrentTrack ? (
                        <span className="text-lg">▶</span>
                      ) : isPastTrack ? (
                        <span className="text-sm text-gray-400">✓</span>
                      ) : (
                        <span className="text-sm text-gray-400">{index + 1}</span>
                      )}
                    </div>

                    {/* Thumbnail */}
                    {track.thumbnail && (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            isCurrentTrack
                              ? 'text-gray-900'
                              : isPastTrack
                              ? 'text-gray-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {track.title}
                        </p>
                        {track.format && <FormatBadge format={track.format} type={track.type} />}
                      </div>
                      {track.artist && (
                        <p className="text-xs text-gray-500 truncate">
                          {track.artist}
                        </p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromPlaylist(track.id);
                      }}
                      className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all text-gray-600"
                      title="Remove from queue"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {playlist.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="text-sm text-gray-600">
              <p>
                {currentIndex + 1} of {playlist.length} playing
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
