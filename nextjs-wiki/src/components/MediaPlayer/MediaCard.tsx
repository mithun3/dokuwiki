'use client';

import React from 'react';
import FormatBadge from './FormatBadge';

interface MediaCardProps {
  title: string;
  format?: string;
  thumbnail?: string;
  type: 'audio' | 'video';
  artist?: string;
  url: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function MediaCard({
  title,
  format,
  thumbnail,
  type,
  artist,
  url,
  onClick,
}: MediaCardProps) {
  const defaultAudioThumbnail = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const defaultVideoThumbnail = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  const defaultThumbnail = type === 'audio' ? defaultAudioThumbnail : defaultVideoThumbnail;

  return (
    <a
      href={url}
      onClick={onClick}
      className="group relative inline-block w-full max-w-xs overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
      title={`${title}${artist ? ` - ${artist}` : ''}`}
    >
      {/* Thumbnail Image */}
      <div
        className="relative aspect-square w-full bg-cover bg-center"
        style={{
          backgroundImage: thumbnail ? `url('${thumbnail}')` : undefined,
          background: !thumbnail ? defaultThumbnail : undefined,
        }}
      >
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/40" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <div className="ml-1 h-0 w-0 border-l-8 border-t-5 border-b-5 border-l-blue-600 border-t-transparent border-b-transparent" />
          </div>
        </div>

        {/* Format Badge */}
        <div className="absolute right-3 top-3">
          <FormatBadge format={format} type={type} />
        </div>

        {/* Media Type Icon (top-left) */}
        <div className="absolute left-3 top-3">
          <div className="rounded-full bg-white/90 p-2">
            {type === 'audio' ? (
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2v8a3 3 0 11-6 0V4a1 1 0 000-2h6zm0 0V0m6 8a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 2v4h4V8H6zm6 0v4h2V8h-2z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Title and Artist */}
      <div className="bg-white p-3">
        <h3 className="truncate font-semibold text-gray-800">{title}</h3>
        {artist && <p className="truncate text-sm text-gray-500">{artist}</p>}
      </div>
    </a>
  );
}
