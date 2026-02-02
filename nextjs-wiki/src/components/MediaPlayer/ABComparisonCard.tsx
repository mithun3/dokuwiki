'use client';

import React from 'react';
import FormatBadge from './FormatBadge';
import { useMediaPlayerStore } from '@/lib/store';
import { createABGroup } from '@/lib/abUtils';
import type { MediaTrack, ABVariant } from '@/lib/types';

interface ABVariantInfo {
  /** Label for this variant (e.g., "Guyatone MM-X") */
  label: string;
  /** URL to the audio file */
  url: string;
  /** Optional separate thumbnail for this variant */
  thumbnail?: string;
}

interface ABComparisonCardProps {
  /** Title for the comparison (e.g., "Guitar Distortion Test") */
  title: string;
  /** Shared thumbnail for the comparison */
  thumbnail?: string;
  /** Array of variants to compare (2-4 items) */
  variants: ABVariantInfo[];
  /** Optional description */
  description?: string;
}

/**
 * ABComparisonCard - A visual card for A/B audio comparison
 * 
 * Features:
 * - Unified card showing all variants (A/B/C/D)
 * - Shared or individual thumbnails
 * - Variant labels with format badges
 * - "Start A/B Comparison" button
 * - Keyboard hint for A/B/C/D switching
 * 
 * @example
 * <ABComparisonCard
 *   title="Distortion Pedal Shootout"
 *   thumbnail="/images/pedals.jpg"
 *   variants={[
 *     { label: "Guyatone MM-X", url: "https://cdn.example.com/guitar_A.mp3" },
 *     { label: "Blackstar HT-DistX", url: "https://cdn.example.com/guitar_B.mp3" },
 *   ]}
 * />
 */
export default function ABComparisonCard({
  title,
  thumbnail,
  variants,
  description,
}: ABComparisonCardProps) {
  const { enterABMode, isABMode, abGroup, activeVariant, playTrack } = useMediaPlayerStore();

  // Check if this comparison is currently active
  const isThisActive = isABMode && abGroup?.baseName === title.toLowerCase().replace(/\s+/g, '-');

  // Extract format from first variant URL
  const format = variants[0]?.url.split('.').pop()?.toLowerCase() || 'mp3';

  const defaultThumbnail = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  const variantLabels: ABVariant[] = ['A', 'B', 'C', 'D'];

  const createTracksFromVariants = (): MediaTrack[] => {
    return variants.map((v, i) => ({
      id: `ab-${Date.now()}-${variantLabels[i]}-${Math.random().toString(36).substr(2, 9)}`,
      url: v.url,
      title: v.label,
      thumbnail: v.thumbnail || thumbnail,
      type: 'audio' as const,
      format: v.url.split('.').pop()?.toLowerCase() as MediaTrack['format'],
    }));
  };

  const handleStartComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const tracks = createTracksFromVariants();
    const group = createABGroup(tracks);

    if (group) {
      // Override the baseName for identification
      group.baseName = title.toLowerCase().replace(/\s+/g, '-');
      enterABMode(group);
    } else {
      // Fallback: just play the first track
      playTrack(tracks[0], true);
    }
  };

  return (
    <div
      className={`relative w-full max-w-xl overflow-hidden rounded-xl border bg-white shadow-md transition-all hover:shadow-xl ${
        isThisActive ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
      }`}
    >
      {/* Header Badge */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-sm font-semibold">A/B COMPARISON</span>
        {isThisActive && (
          <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs">
            Active: {activeVariant}
          </span>
        )}
      </div>

      {/* Title and Description */}
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      {/* Variants Grid */}
      <div className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${Math.min(variants.length, 2)}, 1fr)` }}>
        {variants.map((variant, index) => {
          const variantLetter = variantLabels[index];
          const isActiveVariant = isThisActive && activeVariant === variantLetter;
          const variantThumbnail = variant.thumbnail || thumbnail;

          return (
            <div
              key={variantLetter}
              className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                isActiveVariant
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Variant Letter Badge */}
              <div
                className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isActiveVariant
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/90 text-gray-700 shadow'
                }`}
              >
                {variantLetter}
              </div>

              {/* Format Badge */}
              <div className="absolute right-2 top-2 z-10">
                <FormatBadge format={variant.url.split('.').pop()?.toLowerCase()} type="audio" />
              </div>

              {/* Thumbnail */}
              <div
                className="aspect-video w-full bg-cover bg-center"
                style={{
                  backgroundImage: variantThumbnail ? `url('${variantThumbnail}')` : undefined,
                  background: !variantThumbnail ? defaultThumbnail : undefined,
                }}
              >
                {/* Playing indicator */}
                {isActiveVariant && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex items-end gap-0.5">
                      <div className="h-4 w-1 animate-pulse bg-white" style={{ animationDelay: '0ms' }} />
                      <div className="h-6 w-1 animate-pulse bg-white" style={{ animationDelay: '150ms' }} />
                      <div className="h-3 w-1 animate-pulse bg-white" style={{ animationDelay: '300ms' }} />
                      <div className="h-5 w-1 animate-pulse bg-white" style={{ animationDelay: '450ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Variant Label */}
              <div className="bg-gray-50 px-3 py-2">
                <p className="truncate text-sm font-medium text-gray-700">{variant.label}</p>
                {/* Waveform placeholder */}
                <div className="mt-1 h-4 rounded bg-gray-200 flex items-center justify-center">
                  <span className="text-[10px] text-gray-400">▃▅▇▅▃▂▅▇▅▃</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button and Keyboard Hint */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
        <button
          onClick={handleStartComparison}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            isThisActive
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          {isThisActive ? 'Playing...' : 'Start A/B Comparison'}
        </button>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Keyboard:</span>
          {variants.map((_, i) => (
            <kbd
              key={i}
              className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-gray-600"
            >
              {variantLabels[i]}
            </kbd>
          ))}
          <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-gray-600">
            ESC
          </kbd>
        </div>
      </div>
    </div>
  );
}
