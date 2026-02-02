'use client';

import React from 'react';
import { useMediaPlayerStore } from '@/lib/store';
import type { ABVariant } from '@/lib/types';

/**
 * A/B Toggle Component
 * 
 * Displays toggle buttons for switching between A/B/C/D comparison tracks.
 * Only visible when isABMode is active.
 * 
 * Features:
 * - Visual indication of active variant
 * - Click to switch variants instantly
 * - Shows only available variants (based on group track count)
 * - Exit button to leave A/B mode
 * 
 * @component
 */
export function ABToggle() {
  const {
    isABMode,
    abGroup,
    activeVariant,
    switchVariant,
    exitABMode,
  } = useMediaPlayerStore();

  if (!isABMode || !abGroup) {
    return null;
  }

  // Get available variants from the group
  const availableVariants = abGroup.tracks.map(t => t.abVariant).sort();

  return (
    <div className="ab-toggle flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
      {/* A/B Label */}
      <span className="text-xs font-semibold text-gray-500 mr-1">
        A/B
      </span>
      
      {/* Variant Buttons */}
      <div className="flex gap-1">
        {availableVariants.map((variant) => (
          <VariantButton
            key={variant}
            variant={variant}
            isActive={activeVariant === variant}
            onClick={() => switchVariant(variant)}
          />
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Exit Button */}
      <button
        onClick={exitABMode}
        className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-red-600 
                   hover:bg-red-50 rounded transition-colors"
        title="Exit A/B comparison mode (ESC)"
      >
        ✕ Exit
      </button>

      {/* Keyboard Hint */}
      <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
        Press A/B/C/D to switch
      </span>
    </div>
  );
}

/**
 * Individual variant toggle button
 */
interface VariantButtonProps {
  variant: ABVariant;
  isActive: boolean;
  onClick: () => void;
}

function VariantButton({ variant, isActive, onClick }: VariantButtonProps) {
  const baseClasses = `
    w-10 h-10 flex items-center justify-center
    font-bold text-lg rounded-lg
    transition-all duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
  `;

  const activeClasses = `
    bg-blue-600 text-white shadow-md
    focus:ring-blue-400
  `;

  const inactiveClasses = `
    bg-white text-gray-700 border border-gray-300
    hover:bg-gray-50 hover:border-gray-400
    focus:ring-gray-400
  `;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      title={`Switch to variant ${variant} (Press ${variant})`}
      aria-pressed={isActive}
      aria-label={`Variant ${variant}${isActive ? ' (active)' : ''}`}
    >
      {variant}
      {isActive && (
        <span className="sr-only"> (currently playing)</span>
      )}
    </button>
  );
}

/**
 * Compact A/B indicator for mini player mode
 */
export function ABIndicator() {
  const { isABMode, abGroup, activeVariant } = useMediaPlayerStore();

  if (!isABMode || !abGroup) {
    return null;
  }

  return (
    <div className="ab-indicator inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
      <span>A/B</span>
      <span className="font-bold">{activeVariant}</span>
    </div>
  );
}

export default ABToggle;
