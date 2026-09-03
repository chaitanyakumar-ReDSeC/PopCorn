import React, { useRef } from 'react';
import { Captions, Check, Upload } from 'lucide-react';
import { SubtitleTrack } from '../types';

interface SubtitleCardProps {
  tracks: SubtitleTrack[];
  activeSubtitleId: string | null;
  subtitlesEnabled: boolean;
  onToggleSubtitles: (enabled: boolean) => void;
  onSelectSubtitle: (trackId: string | null) => void;
  onAddSubtitleTrack?: (track: SubtitleTrack) => void;
}

export const SubtitleCard: React.FC<SubtitleCardProps> = ({
  tracks,
  activeSubtitleId,
  subtitlesEnabled,
  onToggleSubtitles,
  onSelectSubtitle,
  onAddSubtitleTrack,
}) => {
  const activeTrack = tracks.find((t) => t.id === activeSubtitleId);
  const subFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLanguageClick = (trackId: string) => {
    if (activeSubtitleId === trackId && subtitlesEnabled) {
      // Toggle off if clicking active
      onSelectSubtitle(null);
      onToggleSubtitles(false);
    } else {
      onSelectSubtitle(trackId);
      onToggleSubtitles(true);
    }
  };

  const handleMasterToggle = () => {
    const newStatus = !subtitlesEnabled;
    onToggleSubtitles(newStatus);
    if (newStatus && !activeSubtitleId && tracks.length > 0) {
      onSelectSubtitle(tracks[0].id);
    }
  };

  const handleSubtitleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      let vttContent = text;

      // Convert SRT to WebVTT if needed
      if (file.name.endsWith('.srt')) {
        vttContent = "WEBVTT\n\n" + text.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2");
      }

      const blob = new Blob([vttContent], { type: 'text/vtt' });
      const trackUrl = URL.createObjectURL(blob);

      const newTrack: SubtitleTrack = {
        id: `sub-ext-${Date.now()}`,
        language: file.name.replace(/\.[^/.]+$/, ""),
        label: `${file.name} (Uploaded)`,
        src: trackUrl,
      };

      if (onAddSubtitleTrack) {
        onAddSubtitleTrack(newTrack);
      }
    }
  };

  return (
    <div className="bg-neutral-900 border border-white/5 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-white">
      {/* Hidden file input for loading local .vtt/.srt subtitle files */}
      <input
        type="file"
        ref={subFileInputRef}
        accept=".srt,.vtt"
        onChange={handleSubtitleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
            <Captions className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-300">
              Subtitle Card
            </h3>
            <p className="text-[11px] text-neutral-500">Show Subtitle / Hide Subtitle Control</p>
          </div>
        </div>

        {/* Master Show / Hide Subtitle toggle buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (!subtitlesEnabled) handleMasterToggle();
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
              subtitlesEnabled
                ? 'bg-red-600 text-white'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400'
            }`}
          >
            Show Subtitle
          </button>

          <button
            onClick={() => {
              if (subtitlesEnabled) handleMasterToggle();
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
              !subtitlesEnabled
                ? 'bg-red-600 text-white'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400'
            }`}
          >
            Hide Subtitle
          </button>
        </div>
      </div>

      {/* Subtitle Language Selector Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
            Subtitle Languages
          </label>

          <button
            onClick={() => subFileInputRef.current?.click()}
            className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Load Subtitle File (.vtt/.srt)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Off option */}
          <button
            onClick={() => {
              onSelectSubtitle(null);
              onToggleSubtitles(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2 rounded-lg transition-colors cursor-pointer border ${
              !subtitlesEnabled || activeSubtitleId === null
                ? 'bg-red-600 text-white border-red-500 font-bold'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-transparent text-sm'
            }`}
          >
            <span className="text-xs font-semibold">Off / Disabled</span>
            {(!subtitlesEnabled || activeSubtitleId === null) && (
              <span className="w-4 h-4 rounded-full bg-white text-red-600 flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>

          {tracks.map((track) => {
            const isActive = subtitlesEnabled && track.id === activeSubtitleId;
            return (
              <button
                key={track.id}
                onClick={() => handleLanguageClick(track.id)}
                className={`flex items-center justify-between px-3.5 py-2 rounded-lg transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-red-600 text-white border-red-500 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-transparent text-sm'
                }`}
              >
                <span className="text-xs font-semibold truncate">{track.language}</span>
                {isActive && (
                  <span className="w-4 h-4 rounded-full bg-white text-red-600 flex items-center justify-center shrink-0 ml-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tracks.length === 0 && (
          <p className="text-[11px] text-neutral-500 italic mt-1">
            No subtitle tracks attached. Click "Load Subtitle File" above to attach an .srt or .vtt subtitle file.
          </p>
        )}
      </div>
    </div>
  );
};
