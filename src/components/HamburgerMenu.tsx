import React from 'react';
import { X, Tv, Film, Play, Shield, Sparkles, Sliders, ChevronRight } from 'lucide-react';
import { ViewMode } from '../types';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark overlay backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-in drawer matching Sleek Interface theme */}
      <div className="relative w-full max-w-sm bg-neutral-900 border-l border-white/10 h-full p-6 text-white flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        {/* Top Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🍿</span>
              <span className="font-black text-xl tracking-tighter">
                <span className="text-red-600">POP</span>
                <span className="text-white">CORN</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dedicated Private Screen Button as requested */}
          <div className="bg-neutral-950 p-5 rounded-xl border border-red-600/40 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-widest">
              <Shield className="w-4 h-4 fill-red-600 text-neutral-950" />
              <span>Dedicated Feature</span>
            </div>

            <h4 className="text-base font-bold text-white">Private Screen</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Access the Video.js player with multi-audio controls, captions toggle, speed settings, and direct URL streaming (.mkv/.mp4).
            </p>

            <button
              onClick={() => {
                onSelectMode('private_screen');
                onClose();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 tracking-wider uppercase text-xs transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Private Screen</span>
            </button>
          </div>

          {/* Catalog View Navigation Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block px-1">
              Navigation
            </label>

            {/* Movies Tab */}
            <button
              onClick={() => {
                onSelectMode('movies');
                onClose();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg border font-medium text-sm transition cursor-pointer ${
                currentMode === 'movies'
                  ? 'bg-red-600/20 text-white border-red-600 font-bold'
                  : 'bg-neutral-950 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Film className="w-4 h-4 text-red-500" />
                <span>Movies</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Series Tab */}
            <button
              onClick={() => {
                onSelectMode('series');
                onClose();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg border font-medium text-sm transition cursor-pointer ${
                currentMode === 'series'
                  ? 'bg-red-600/20 text-white border-red-600 font-bold'
                  : 'bg-neutral-950 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Tv className="w-4 h-4 text-red-500" />
                <span>Series</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Features Highlights */}
          <div className="bg-neutral-950 rounded-lg p-4 border border-white/5 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-red-500 font-bold uppercase tracking-widest text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Features Included</span>
            </div>
            <ul className="space-y-1.5 text-neutral-400">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span>Video.js Engine (Play, Pause, +/-10s)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span>Multi-Audio Language Buttons</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span>Show/Hide Subtitle Card</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span>Browse Media & Stream Media (.mkv/.mp4)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
            Sleek Interface • Red, Black, White
          </p>
        </div>
      </div>
    </div>
  );
};
