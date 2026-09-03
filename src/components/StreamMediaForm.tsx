import React, { useState } from 'react';
import { Link2, Play, AlertCircle } from 'lucide-react';

interface StreamMediaFormProps {
  onStreamUrlSubmit: (url: string, mediaName?: string) => void;
  currentUrl: string;
}

export const StreamMediaForm: React.FC<StreamMediaFormProps> = ({
  onStreamUrlSubmit,
  currentUrl,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [customTitle, setCustomTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setErrorMsg('Please enter a valid video stream URL (.mp4, .mkv, .webm, or HLS)');
      return;
    }
    setErrorMsg(null);
    onStreamUrlSubmit(inputUrl.trim(), customTitle.trim() || 'Direct Network Stream');
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-white">
      <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
          <Link2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white tracking-wide">Stream Direct Media URL</h3>
          <p className="text-xs text-zinc-400">Fetch & play direct .mp4, .mkv, or network video streams</p>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
            Direct Media URL (.mkv / .mp4 / .webm)
          </label>
          <div className="relative">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-600 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
            Custom Title (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. My Video Stream"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-600 outline-none transition"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-950/60 border border-red-800/80 p-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wide shadow-red-glow flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Fetch Stream & Play in Video.js</span>
        </button>
      </form>
    </div>
  );
};
