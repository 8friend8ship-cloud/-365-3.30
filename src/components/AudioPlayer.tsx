import React from 'react';

interface AudioPlayerProps {
  url: string;
  lang: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, lang }) => {
  if (!url) return null;

  // Extract ID from Drive URL
  const match = url.match(/id=([a-zA-Z0-9_-]+)/);
  const fileId = match ? match[1] : null;
  const proxyUrl = fileId ? `/api/audio-proxy?id=${fileId}` : url;

  return (
    <div className="p-2 border rounded-lg bg-white shadow-sm">
      <p className="text-xs font-bold mb-1">{lang}</p>
      <audio controls src={proxyUrl} className="w-full h-8" />
    </div>
  );
};
