'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ArticleMetadata {
  title: string;
  evolutionPhase?: 'foundational' | 'refined' | 'experimental' | 'archived';
  lastReviewedAt?: string;
  status?: 'active' | 'draft' | 'deprecated';
}

const phaseColors = {
  foundational: 'bg-blue-100 text-blue-800 border border-blue-300',
  refined: 'bg-green-100 text-green-800 border border-green-300',
  experimental: 'bg-amber-100 text-amber-800 border border-amber-300',
  archived: 'bg-gray-100 text-gray-800 border border-gray-300',
};

const statusColors = {
  active: 'text-green-700',
  draft: 'text-yellow-700',
  deprecated: 'text-red-700',
};

const phaseDescriptions = {
  foundational: 'Foundational — Core concepts and essential knowledge',
  refined: 'Refined — Well-developed with practical experience',
  experimental: 'Experimental — Emerging approaches and ideas',
  archived: 'Archived — Historical reference only',
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function ArticleFooter({ metadata }: { metadata: ArticleMetadata }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { evolutionPhase, lastReviewedAt, status } = metadata;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (!evolutionPhase && !lastReviewedAt && !status)) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-300">
      <div className="flex flex-col gap-4 text-sm text-gray-700">
        {/* Evolution Phase Badge */}
        {evolutionPhase && (
          <div className="flex items-start gap-3">
            <span className="font-semibold whitespace-nowrap pt-0.5">Article Stage:</span>
            <div className="flex flex-col gap-1">
              <span
                className={`inline-block px-3 py-1 rounded-md font-medium text-sm ${phaseColors[evolutionPhase]}`}
              >
                {evolutionPhase.charAt(0).toUpperCase() + evolutionPhase.slice(1)}
              </span>
              <p className="text-gray-600 text-xs">{phaseDescriptions[evolutionPhase]}</p>
            </div>
          </div>
        )}

        {/* Last Reviewed Date */}
        {lastReviewedAt && (
          <div className="flex items-center gap-3">
            <span className="font-semibold">Last Reviewed:</span>
            <span className="text-gray-600">{formatDate(lastReviewedAt)}</span>
          </div>
        )}

        {/* Status Indicator */}
        {status && (
          <div className="flex items-center gap-3">
            <span className="font-semibold">Status:</span>
            <span className={`font-medium ${statusColors[status]}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        )}

        {/* Git History Link */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href={`https://github.com/mithun3/dokuwiki/commits/main/nextjs-wiki/content${pathname}.mdx`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-xs"
          >
            <span>📝 View edit history on GitHub</span>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
