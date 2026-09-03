import React from 'react';
import { Shield, Search, Home as HomeIcon } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onOpenPrivateScreenModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  moviesCount?: number;
  seriesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenPrivateScreenModal,
  searchQuery,
  onSearchChange,
  moviesCount = 0,
  seriesCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-red-600/30 bg-neutral-900/50 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-6 sm:gap-10">
        {/* Left: PopCorn Brand Logo -> Navigates to Home */}
        <div
          onClick={() => onSelectMode('home')}
          className="cursor-pointer font-black text-2xl tracking-tighter select-none flex items-center gap-1.5"
          title="Go to Home"
        >
          <img
            src="https://raw.githubusercontent.com/chaitanyakumar-ReDSeC/assets/main/general/image_assets/static/popcorn.png"
            alt="Popcorn"
            className="w-6 h-6 object-contain"
          />
          <div className="flex items-center">
            <span className="text-red-600 font-extrabold">POP</span>
            <span className="text-white font-extrabold">CORN</span>
          </div>
        </div>

        {/* Center: Sleek Navigation Tabs (Home, Movies, Series) */}
        <nav className="flex items-center gap-4 sm:gap-6 h-16">
          {/* Home Tab */}
          <button
            onClick={() => onSelectMode('home')}
            className={`relative h-16 flex items-center gap-1.5 font-semibold text-sm transition-colors cursor-pointer ${
              currentMode === 'home' ? 'text-red-600 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HomeIcon className="w-4 h-4" />
            <span>Home</span>
            {currentMode === 'home' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>

          {/* Movies Tab */}
          <button
            onClick={() => onSelectMode('movies')}
            className={`relative h-16 flex items-center gap-1.5 font-semibold text-sm transition-colors cursor-pointer ${
              currentMode === 'movies' ? 'text-red-600 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Movies</span>
            <span className="bg-neutral-800 text-xs px-2 py-0.5 rounded-full font-mono text-neutral-300">
              {moviesCount}
            </span>
            {currentMode === 'movies' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>

          {/* Series Tab */}
          <button
            onClick={() => onSelectMode('series')}
            className={`relative h-16 flex items-center gap-1.5 font-semibold text-sm transition-colors cursor-pointer ${
              currentMode === 'series' ? 'text-red-600 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Series</span>
            <span className="bg-neutral-800 text-xs px-2 py-0.5 rounded-full font-mono text-neutral-300">
              {seriesCount}
            </span>
            {currentMode === 'series' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        </nav>
      </div>

      {/* Right Section: Search + Single Combined Private Screen Button */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Search */}
        <div className="relative hidden sm:block w-40 lg:w-52">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search media..."
            className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 rounded-lg py-1 pl-8 pr-3 text-xs text-white placeholder-neutral-500 outline-none transition"
          />
        </div>

        {/* Combined Private Screen Button in Red */}
        <button
          onClick={onOpenPrivateScreenModal}
          className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-widest text-white transition-colors cursor-pointer flex items-center space-x-1.5 ${
            currentMode === 'private_screen'
              ? 'bg-red-700 ring-1 ring-white/30'
              : 'bg-red-600 hover:bg-red-700 shadow-md'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Private Screen</span>
        </button>
      </div>
    </header>
  );
};

