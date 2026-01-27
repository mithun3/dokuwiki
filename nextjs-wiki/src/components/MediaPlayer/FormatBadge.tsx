'use client';

import React from 'react';

interface FormatBadgeProps {
  format?: string;
  type: 'audio' | 'video';
}

export default function FormatBadge({ format, type }: FormatBadgeProps) {
  if (!format) return null;

  const displayFormat = format.toUpperCase();
  
  const audioFormats = ['MP3', 'WAV', 'OGG', 'AAC', 'M4A', 'OPUS', 'FLAC'];
  const videoFormats = ['MP4', 'WEBM', 'OGV'];
  
  const isAudio = audioFormats.includes(displayFormat);
  const isVideo = videoFormats.includes(displayFormat);

  const bgColor = isAudio ? 'bg-blue-100' : isVideo ? 'bg-orange-100' : 'bg-gray-100';
  const textColor = isAudio ? 'text-blue-800' : isVideo ? 'text-orange-800' : 'text-gray-800';

  return (
    <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-semibold`}>
      {displayFormat}
    </span>
  );
}
