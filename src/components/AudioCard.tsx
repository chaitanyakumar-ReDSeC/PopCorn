import React from 'react';
import { Volume2, Check, Radio, Cpu, Sparkles } from 'lucide-react';
import { AudioTrack } from '../types';

interface AudioCardProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
}

export const AudioCard: React.FC<AudioCardProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
}) => {
  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  return (
    <div className="bg-neutral-900 border border-white/5 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-300">
              Audio Card
            </h3>
            <p className="text-[11px] text-neutral-500">Multi-Audio Media Stream Switcher</p>
          </div>
        </div>

        {/* Active badge */}
        <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center space-x-1">
          <Radio className="w-3 h-3 animate-pulse text-red-500" />
          <span>Active: {activeTrack?.language}</span>
        </span>
      </div>

      {/* Multi-Audio Language Buttons */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
          Audio Languages
        </label>
        {tracks.length === 0 ? (
          <p className="text-[11px] text-neutral-500 italic">
            Default system audio track active.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tracks.map((track) => {
              const isActive = track.id === activeTrackId;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-lg transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-red-600 text-white border-red-500 font-bold shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-semibold">{track.language}</span>
                    {track.isOriginal ? (
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                          isActive ? 'text-white' : 'text-red-500'
                        }`}
                      >
                        ORIGINAL
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] ${isActive ? 'text-red-100' : 'text-neutral-500'}`}
                      >
                        {track.channels || 'Audio Stream'}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="w-4 h-4 rounded-full bg-white text-red-600 flex items-center justify-center shrink-0 ml-2">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Technical Specs Bar */}
      {activeTrack && (
        <div className="bg-neutral-950 rounded-lg p-3 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-3 text-neutral-400">
            <div className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-red-500" />
              <span>Codec:</span>
              <span className="text-white font-mono font-bold">{activeTrack.codec}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-neutral-700" />
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Label:</span>
              <span className="text-white font-semibold">{activeTrack.label}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 h-3.5">
            <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.6s_infinite_100ms] h-full" />
            <span className="w-1 bg-red-500 rounded-full animate-[pulse_0.6s_infinite_300ms] h-2/3" />
            <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.6s_infinite_200ms] h-3/4" />
            <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.6s_infinite_400ms] h-full" />
          </div>
        </div>
      )}
    </div>
  );
};
