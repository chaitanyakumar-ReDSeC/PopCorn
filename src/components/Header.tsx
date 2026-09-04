import React, { useState } from 'react';
import { Shield, Search, Home as HomeIcon, X, Menu } from 'lucide-react';
import { ViewMode } from '../types';
import { HamburgerMenu } from './HamburgerMenu';

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-red-600/30 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-8">
      <div className="h-16 flex items-center justify-between gap-3 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          {/* Left: PopCorn Brand Logo -> Navigates to Home */}
          <div
            onClick={() => onSelectMode('home')}
            className="cursor-pointer font-black text-xl sm:text-2xl tracking-tighter select-none flex items-center gap-1.5 shrink-0"
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

          {/* Desktop Navigation Tabs (Hidden on mobile / shorter screens, moved to Hamburger Menu) */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-6 h-16">
            {/* Home Tab */}
            <button
              onClick={() => onSelectMode('home')}
              className={`relative h-16 flex items-center gap-1.5 font-semibold text-sm transition-colors cursor-pointer ${
                currentMode === 'home' ? 'text-red-600 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <HomeIcon className="w-4 h-4 shrink-0" />
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

        {/* Right Section: Desktop Search & Button, Mobile Search Toggle & Hamburger Menu Button */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Quick Search - Desktop */}
          <div className="relative hidden md:block w-44 lg:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search media..."
              className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 outline-none transition"
            />
          </div>

          {/* Combined Private Screen Button in Red - Desktop Only */}
          <button
            onClick={onOpenPrivateScreenModal}
            className={`hidden md:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-md ${
              currentMode === 'private_screen'
                ? 'bg-red-700 ring-1 ring-white/30 shadow-red-600/30'
                : 'bg-red-600 hover:bg-red-700 active:scale-95'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Private Screen</span>
          </button>

          {/* Quick Search - Mobile Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
            title="Toggle Search"
            aria-label="Toggle Search"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4 text-red-500" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Hamburger Menu Toggle Button - Visible on mobile/shorter screens (< md) */}
          <button
            id="mobile-hamburger-toggle-btn"
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 rounded-lg bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 border border-white/10 transition cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Input Drawer (Visible when toggled on small screens) */}
      {isMobileSearchOpen && (
        <div className="md:hidden pb-3 pt-1 border-t border-white/5 animate-fadeIn">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search movies, series, titles..."
              autoFocus
              className="w-full bg-neutral-950 border border-red-600/60 focus:border-red-500 rounded-lg py-1.5 pl-8 pr-8 text-xs text-white placeholder-neutral-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Slide-out Hamburger Menu for Mobile View */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentMode={currentMode}
        onSelectMode={(mode) => {
          onSelectMode(mode);
          setIsMenuOpen(false);
        }}
        onOpenPrivateScreenModal={() => {
          onOpenPrivateScreenModal();
          setIsMenuOpen(false);
        }}
        moviesCount={moviesCount}
        seriesCount={seriesCount}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </header>
  );
};

