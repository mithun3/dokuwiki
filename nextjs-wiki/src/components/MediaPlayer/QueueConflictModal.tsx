'use client';

import React from 'react';
import type { MediaTrack } from '@/lib/types';

interface QueueConflictModalProps {
  isOpen: boolean;
  currentTrack: MediaTrack | null;
  newTrack: MediaTrack;
  onReplace: () => void;
  onPlayNext: () => void;
  onAddToQueue: () => void;
  onClose: () => void;
}

export function QueueConflictModal({
  isOpen,
  currentTrack,
  newTrack,
  onReplace,
  onPlayNext,
  onAddToQueue,
  onClose,
}: QueueConflictModalProps) {
  if (!isOpen || !currentTrack) return null;

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Queue Action
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Currently Playing */}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Currently Playing
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-3">
                  {currentTrack.thumbnail && (
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">▶</span>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {currentTrack.title}
                      </p>
                    </div>
                    {currentTrack.artist && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentTrack.artist}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* New Track */}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                You Clicked
              </p>
              <div className="bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-800/30 rounded-lg p-4 border border-amber-200 dark:border-orange-700">
                <div className="flex items-start gap-3">
                  {newTrack.thumbnail && (
                    <img
                      src={newTrack.thumbnail}
                      alt={newTrack.title}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {newTrack.title}
                    </p>
                    {newTrack.artist && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {newTrack.artist}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Question */}
            <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
              What would you like to do?
            </p>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {/* Replace & Play */}
            <button
              onClick={() => handleAction(onReplace)}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>⏹</span>
              <span>Replace & Play Now</span>
            </button>

            {/* Play Next */}
            <button
              onClick={() => handleAction(onPlayNext)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>⏭</span>
              <span>Play Next</span>
            </button>

            {/* Add to Queue */}
            <button
              onClick={() => handleAction(onAddToQueue)}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>Add to Queue</span>
            </button>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
