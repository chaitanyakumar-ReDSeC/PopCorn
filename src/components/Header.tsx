import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Shield, Search, Home as HomeIcon, X, Menu, Play } from 'lucide-react';
import { ViewMode, MediaItem } from '../types';
import { HamburgerMenu } from './HamburgerMenu';

interface HeaderProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onOpenPrivateScreenModal: () => void;
  homeSearchQuery: string;
  onHomeSearchChange: (query: string) => void;
  moviesSearchQuery: string;
  onMoviesSearchChange: (query: string) => void;
  seriesSearchQuery: string;
  onSeriesSearchChange: (query: string) => void;
  moviesCount?: number;
  seriesCount?: number;
  movies?: MediaItem[];
  series?: MediaItem[];
  onPlayMovie?: (movie: MediaItem) => void;
  onPlaySeries?: (series: MediaItem, videoUrl?: string, title?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenPrivateScreenModal,
  homeSearchQuery,
  onHomeSearchChange,
  moviesSearchQuery,
  onMoviesSearchChange,
  seriesSearchQuery,
  onSeriesSearchChange,
  moviesCount = 0,
  seriesCount = 0,
  movies = [],
  series = [],
  onPlayMovie,
  onPlaySeries,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Active query, setter and placeholder according to the current tab
  const activeSearchQuery =
    currentMode === 'home'
      ? homeSearchQuery
      : currentMode === 'movies'
      ? moviesSearchQuery
      : currentMode === 'series'
      ? seriesSearchQuery
      : '';

  const handleSearchChange = (val: string) => {
    if (currentMode === 'home') {
      onHomeSearchChange(val);
      if (val.trim()) {
        setIsDesktopDropdownOpen(true);
        setIsMobileDropdownOpen(true);
      }
    } else if (currentMode === 'movies') {
      onMoviesSearchChange(val);
    } else if (currentMode === 'series') {
      onSeriesSearchChange(val);
    }
  };

  const handleClearSearch = () => {
    handleSearchChange('');
    setIsDesktopDropdownOpen(false);
    setIsMobileDropdownOpen(false);
  };

  const searchPlaceholder =
    currentMode === 'home'
      ? 'Search movies & series...'
      : currentMode === 'movies'
      ? 'Search movies...'
      : currentMode === 'series'
      ? 'Search series...'
      : 'Search media...';

  // Home search results matching both movies and series
  const matchingMovies = useMemo(() => {
    if (currentMode !== 'home' || !homeSearchQuery.trim()) return [];
    const q = homeSearchQuery.trim().toLowerCase();
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genres?.some((g) => g.toLowerCase().includes(q))
    );
  }, [currentMode, homeSearchQuery, movies]);

  const matchingSeries = useMemo(() => {
    if (currentMode !== 'home' || !homeSearchQuery.trim()) return [];
    const q = homeSearchQuery.trim().toLowerCase();
    return series.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.genres?.some((g) => g.toLowerCase().includes(q))
    );
  }, [currentMode, homeSearchQuery, series]);

  const totalHomeResults = matchingMovies.length + matchingSeries.length;

  // Click outside listener to dismiss Home search dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target as Node)
      ) {
        setIsDesktopDropdownOpen(false);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setIsMobileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render the Home page search results dropdown with small cards
  const renderHomeSearchResults = (onClose: () => void, isMobile = false) => {
    return (
      <div
        className={`absolute top-full mt-2 bg-neutral-900/98 backdrop-blur-xl border border-red-600/40 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col ${
          isMobile
            ? 'left-0 right-0 max-h-[360px]'
            : 'right-0 w-80 sm:w-96 max-h-[420px]'
        }`}
      >
        {/* Results Header */}
        <div className="px-3.5 py-2 border-b border-white/10 bg-neutral-950/80 flex items-center justify-between text-xs">
          <span className="text-neutral-400 font-medium">
            Found <strong className="text-white">{totalHomeResults}</strong>{' '}
            {totalHomeResults === 1 ? 'title' : 'titles'}
          </span>
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-[11px] text-neutral-400 hover:text-red-400 font-medium transition cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Small Cards Scrollable List */}
        <div className="overflow-y-auto p-2 space-y-1.5 divide-y divide-white/5 max-h-[350px]">
          {totalHomeResults === 0 ? (
            <div className="p-6 text-center text-neutral-400 space-y-1">
              <p className="text-sm font-bold text-white">No Titles Found</p>
              <p className="text-xs text-neutral-500">
                No titles matching &quot;{homeSearchQuery}&quot;
              </p>
            </div>
          ) : (
            <>
              {/* Movies Small Cards */}
              {matchingMovies.map((movie) => (
                <div
                  key={`home-search-movie-${movie.id}`}
                  onClick={() => {
                    onPlayMovie?.(movie);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/90 transition cursor-pointer group border border-transparent hover:border-red-600/30 pt-2"
                >
                  {/* Small Poster */}
                  <div className="relative w-10 h-14 rounded-md overflow-hidden bg-neutral-950 shrink-0 border border-white/10">
                    <img
                      src={movie.poster || movie.banner}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-white fill-current" />
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none bg-red-600 text-white">
                        Movie
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {movie.year}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition truncate mt-1">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {movie.genres?.slice(0, 2).join(' • ') || 'Feature Film'}
                    </p>
                  </div>

                  <div className="text-neutral-500 group-hover:text-red-500 transition pr-1 shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              ))}

              {/* Series Small Cards */}
              {matchingSeries.map((sItem) => (
                <div
                  key={`home-search-series-${sItem.id}`}
                  onClick={() => {
                    onPlaySeries?.(sItem);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/90 transition cursor-pointer group border border-transparent hover:border-red-600/30 pt-2"
                >
                  {/* Small Poster */}
                  <div className="relative w-10 h-14 rounded-md overflow-hidden bg-neutral-950 shrink-0 border border-white/10">
                    <img
                      src={sItem.poster || sItem.banner}
                      alt={sItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-white fill-current" />
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none bg-neutral-800 text-red-400 border border-red-600/30">
                        Series
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {sItem.year}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition truncate mt-1">
                      {sItem.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {sItem.episodes?.length
                        ? `${sItem.seasonsCount || 1}S • ${sItem.episodes.length} Eps`
                        : 'Series'}
                    </p>
                  </div>

                  <div className="text-neutral-500 group-hover:text-red-500 transition pr-1 shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

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

          {/* Desktop Navigation Tabs */}
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
          <div ref={desktopSearchRef} className="relative hidden md:block w-48 sm:w-56 lg:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={activeSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (currentMode === 'home' && homeSearchQuery.trim()) {
                  setIsDesktopDropdownOpen(true);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 rounded-lg py-1.5 pl-8 pr-7 text-xs text-white placeholder-neutral-500 outline-none transition"
            />
            {activeSearchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Home Page Search Results Dropdown (Below the Search Box) */}
            {currentMode === 'home' && isDesktopDropdownOpen && homeSearchQuery.trim() && (
              renderHomeSearchResults(() => setIsDesktopDropdownOpen(false))
            )}
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
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              if (!isMobileSearchOpen && currentMode === 'home' && homeSearchQuery.trim()) {
                setIsMobileDropdownOpen(true);
              }
            }}
            className="md:hidden p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
            title="Toggle Search"
            aria-label="Toggle Search"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4 text-red-500" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Hamburger Menu Toggle Button */}
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

      {/* Mobile Search Input Drawer */}
      {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="relative md:hidden pb-3 pt-1 border-t border-white/5 animate-fadeIn">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={activeSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (currentMode === 'home' && homeSearchQuery.trim()) {
                  setIsMobileDropdownOpen(true);
                }
              }}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full bg-neutral-950 border border-red-600/60 focus:border-red-500 rounded-lg py-1.5 pl-8 pr-8 text-xs text-white placeholder-neutral-500 outline-none transition"
            />
            {activeSearchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Home Page Search Results Dropdown */}
          {currentMode === 'home' && isMobileDropdownOpen && homeSearchQuery.trim() && (
            renderHomeSearchResults(() => setIsMobileDropdownOpen(false), true)
          )}
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
      />
    </header>
  );
};

