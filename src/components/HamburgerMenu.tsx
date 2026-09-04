import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Tv,
  Film,
  Play,
  Shield,
  Sparkles,
  ChevronRight,
  Home as HomeIcon,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ViewMode } from '../types';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onOpenPrivateScreenModal: () => void;
  moviesCount?: number;
  seriesCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  onOpenPrivateScreenModal,
  moviesCount = 0,
  seriesCount = 0,
  searchQuery = '',
  onSearchChange,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when drawer is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          id="hamburger-menu-portal"
          className="fixed inset-0 z-[9999] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Backdrop with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-in Drawer with smooth right-to-left swipe animation and drag-to-dismiss */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 400) {
                onClose();
              }
            }}
            className="relative w-full max-w-[320px] sm:max-w-sm bg-neutral-900 border-l border-white/10 h-full p-5 text-white flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
          >
            {/* Top Section */}
            <div className="space-y-4">
              {/* Header: Brand and Close */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div
                  onClick={() => {
                    onSelectMode('home');
                    onClose();
                  }}
                  className="flex items-center space-x-2 cursor-pointer select-none"
                >
                  <img
                    src="https://raw.githubusercontent.com/chaitanyakumar-ReDSeC/assets/main/general/image_assets/static/popcorn.png"
                    alt="Popcorn"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="font-black text-xl tracking-tighter">
                    <span className="text-red-600 font-extrabold">POP</span>
                    <span className="text-white font-extrabold">CORN</span>
                  </span>
                </div>

                <button
                  id="close-hamburger-menu-btn"
                  onClick={onClose}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Search */}
              {onSearchChange && (
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search movies, series, titles..."
                    className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>
              )}

              {/* Primary Navigation Tabs */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-1 pb-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                    Navigation Tabs
                  </label>
                  <span className="text-[10px] text-neutral-500">Swipe right to close</span>
                </div>

                {/* Home Tab */}
                <button
                  id="mobile-nav-home-btn"
                  onClick={() => {
                    onSelectMode('home');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border font-semibold text-sm transition cursor-pointer active:scale-[0.99] ${
                    currentMode === 'home'
                      ? 'bg-red-600/15 text-white border-red-600 shadow-sm shadow-red-600/20 font-bold'
                      : 'bg-neutral-950 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        currentMode === 'home' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-red-500'
                      }`}
                    >
                      <HomeIcon className="w-4 h-4" />
                    </div>
                    <span>Home</span>
                  </div>
                  {currentMode === 'home' ? (
                    <CheckCircle2 className="w-4 h-4 text-red-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  )}
                </button>

                {/* Movies Tab */}
                <button
                  id="mobile-nav-movies-btn"
                  onClick={() => {
                    onSelectMode('movies');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border font-semibold text-sm transition cursor-pointer active:scale-[0.99] ${
                    currentMode === 'movies'
                      ? 'bg-red-600/15 text-white border-red-600 shadow-sm shadow-red-600/20 font-bold'
                      : 'bg-neutral-950 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        currentMode === 'movies' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-red-500'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                    </div>
                    <span>Movies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-neutral-800 text-[11px] px-2 py-0.5 rounded-full font-mono text-neutral-300 border border-white/5">
                      {moviesCount}
                    </span>
                    {currentMode === 'movies' ? (
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                </button>

                {/* Series Tab */}
                <button
                  id="mobile-nav-series-btn"
                  onClick={() => {
                    onSelectMode('series');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border font-semibold text-sm transition cursor-pointer active:scale-[0.99] ${
                    currentMode === 'series'
                      ? 'bg-red-600/15 text-white border-red-600 shadow-sm shadow-red-600/20 font-bold'
                      : 'bg-neutral-950 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        currentMode === 'series' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-red-500'
                      }`}
                    >
                      <Tv className="w-4 h-4" />
                    </div>
                    <span>Series</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-neutral-800 text-[11px] px-2 py-0.5 rounded-full font-mono text-neutral-300 border border-white/5">
                      {seriesCount}
                    </span>
                    {currentMode === 'series' ? (
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                </button>

                {/* Private Screen Tab */}
                <button
                  id="mobile-nav-private-screen-btn"
                  onClick={() => {
                    onOpenPrivateScreenModal();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border font-semibold text-sm transition cursor-pointer active:scale-[0.99] ${
                    currentMode === 'private_screen'
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30'
                      : 'bg-gradient-to-r from-red-950/40 to-neutral-950 text-white border-red-600/40 hover:border-red-600 hover:bg-red-950/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/50">
                      <Shield className="w-4 h-4 fill-white text-red-600" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold leading-tight">Private Screen</span>
                      <span className="text-[10px] text-neutral-400 font-normal">Video.js Engine</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-red-600/30 border border-red-500/30 px-2 py-0.5 rounded-full">
                    <Play className="w-3 h-3 fill-red-400 text-red-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-300">Launch</span>
                  </div>
                </button>
              </div>

              {/* Dedicated Private Screen Card */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-white/10 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-red-500 font-bold text-[11px] uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Private Screening</span>
                  </div>
                  <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-600/30 px-1.5 py-0.5 rounded font-mono">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Dedicated Video.js player with multi-audio controls, speed settings, subtitles, and direct URL streaming.
                </p>
                <button
                  id="mobile-launch-private-screen-card-btn"
                  onClick={() => {
                    onOpenPrivateScreenModal();
                    onClose();
                  }}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg font-bold flex items-center justify-center gap-2 text-xs tracking-wider uppercase transition shadow-md shadow-red-600/30 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Open Screening Options</span>
                </button>
              </div>

              {/* Features Included */}
              <div className="bg-neutral-950 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-red-500 font-bold uppercase tracking-widest text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Integrated Features</span>
                </div>
                <ul className="space-y-1.5 text-neutral-400 text-[11px]">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    <span>Video.js Engine with Full Multi-Audio</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    <span>CORS-Proxied English Subtitles</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    <span>Local Files & Direct URL Streaming</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 text-center mt-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                POPCORN MEDIA • SLEEK INTERFACE
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

