import React, { useRef, useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, ArrowRight, Film, Tv } from 'lucide-react';
import { MediaItem } from '../types';

interface HomePageProps {
  movies: MediaItem[];
  series: MediaItem[];
  onPlayMovie: (movie: MediaItem) => void;
  onPlaySeries: (series: MediaItem, videoUrl?: string, title?: string) => void;
  onNavigateTab: (tab: 'movies' | 'series' | 'private_screen') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  movies,
  series,
  onPlayMovie,
  onPlaySeries,
  onNavigateTab,
}) => {
  const movieRowRef = useRef<HTMLDivElement>(null);
  const seriesRowRef = useRef<HTMLDivElement>(null);

  const [isMovieHovered, setIsMovieHovered] = useState(false);
  const [isSeriesHovered, setIsSeriesHovered] = useState(false);

  // Take up to 10 items for each carousel section
  const topMovies = movies.slice(0, 10);
  const topSeries = series.slice(0, 10);

  // Continuous auto-scrolling walk-around right effect
  useEffect(() => {
    if (isMovieHovered) return;
    const interval = setInterval(() => {
      if (movieRowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = movieRowRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          movieRowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          movieRowRef.current.scrollBy({ left: 240, behavior: 'smooth' });
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isMovieHovered, topMovies.length]);

  useEffect(() => {
    if (isSeriesHovered) return;
    const interval = setInterval(() => {
      if (seriesRowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = seriesRowRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          seriesRowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          seriesRowRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isSeriesHovered, topSeries.length]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16">
      {/* SECTION 1: MOVIES CATALOG CAROUSEL */}
      <section className="space-y-4">
        {/* Section Header with Show All Hover Link & Controls */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => onNavigateTab('movies')}
            className="group/header flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-5 bg-red-600 rounded-sm" />
              <div className="flex items-center space-x-2 text-base sm:text-lg font-black text-white uppercase tracking-wider group-hover/header:text-red-500 transition-colors">
                <Film className="w-4 h-4 text-red-500" />
                <span>Movies Catalog</span>
              </div>
            </div>

            {/* Hover sliding arrow & "Show all" reveal */}
            <div className="flex items-center text-xs font-bold text-neutral-400 group-hover/header:text-red-500 transition-colors">
              <div className="max-w-0 opacity-0 -translate-x-2 group-hover/header:max-w-xs group-hover/header:opacity-100 group-hover/header:translate-x-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out flex items-center pr-1.5">
                <span className="text-red-500 font-bold">Show all</span>
              </div>
              <ArrowRight className="w-4 h-4 text-red-500 transform group-hover/header:translate-x-1 transition-transform duration-300" />
            </div>
          </div>

          {/* Left/Right Arrow Carousel Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => scrollContainer(movieRowRef, 'left')}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Scroll left"
              aria-label="Scroll left movies"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollContainer(movieRowRef, 'right')}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Scroll right"
              aria-label="Scroll right movies"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Row */}
        {topMovies.length === 0 ? (
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-8 text-center text-neutral-400">
            <p className="text-sm font-bold text-white">No Movies Found</p>
            <p className="text-xs text-neutral-500 mt-1">Coming soon.</p>
          </div>
        ) : (
          <div
            ref={movieRowRef}
            onMouseEnter={() => setIsMovieHovered(true)}
            onMouseLeave={() => setIsMovieHovered(false)}
            className="flex items-stretch gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => onPlayMovie(movie)}
                className="group flex-shrink-0 w-44 sm:w-52 bg-neutral-900/90 rounded-xl overflow-hidden border border-white/5 hover:border-red-600/70 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] overflow-hidden bg-neutral-950">
                  <img
                    src={movie.poster || movie.banner}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                  {/* Play Hover Button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-neutral-300 border border-white/10">
                    {movie.year}
                  </div>
                </div>

                {/* Movie Title & Info */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-500 transition line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {movie.genres?.slice(0, 2).join(' • ') || 'Movie'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayMovie(movie);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: SERIES CATALOG CAROUSEL */}
      <section className="space-y-4">
        {/* Section Header with Show All Hover Link & Controls */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => onNavigateTab('series')}
            className="group/header flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-5 bg-red-600 rounded-sm" />
              <div className="flex items-center space-x-2 text-base sm:text-lg font-black text-white uppercase tracking-wider group-hover/header:text-red-500 transition-colors">
                <Tv className="w-4 h-4 text-red-500" />
                <span>Series Catalog</span>
              </div>
            </div>

            {/* Hover sliding arrow & "Show all" reveal */}
            <div className="flex items-center text-xs font-bold text-neutral-400 group-hover/header:text-red-500 transition-colors">
              <div className="max-w-0 opacity-0 -translate-x-2 group-hover/header:max-w-xs group-hover/header:opacity-100 group-hover/header:translate-x-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out flex items-center pr-1.5">
                <span className="text-red-500 font-bold">Show all</span>
              </div>
              <ArrowRight className="w-4 h-4 text-red-500 transform group-hover/header:translate-x-1 transition-transform duration-300" />
            </div>
          </div>

          {/* Left/Right Arrow Carousel Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => scrollContainer(seriesRowRef, 'left')}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Scroll left"
              aria-label="Scroll left series"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollContainer(seriesRowRef, 'right')}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Scroll right"
              aria-label="Scroll right series"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Series Carousel Row */}
        {topSeries.length === 0 ? (
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-8 text-center text-neutral-400">
            <p className="text-sm font-bold text-white">No Series Found</p>
            <p className="text-xs text-neutral-500 mt-1">Coming soon.</p>
          </div>
        ) : (
          <div
            ref={seriesRowRef}
            onMouseEnter={() => setIsSeriesHovered(true)}
            onMouseLeave={() => setIsSeriesHovered(false)}
            className="flex items-stretch gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topSeries.map((sItem) => (
              <div
                key={sItem.id}
                onClick={() => onPlaySeries(sItem)}
                className="group flex-shrink-0 w-44 sm:w-52 bg-neutral-900/90 rounded-xl overflow-hidden border border-white/5 hover:border-red-600/70 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] overflow-hidden bg-neutral-950">
                  <img
                    src={sItem.poster || sItem.banner}
                    alt={sItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                  {/* Play Hover Button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Series Flag & Episode count badge */}
                  <div className="absolute top-2 left-2 bg-red-600/95 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white border border-red-400/30 flex items-center space-x-1 shadow-lg z-10">
                    <Tv className="w-2.5 h-2.5 text-white fill-current" />
                    <span>Series</span>
                  </div>

                  <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-neutral-300 border border-white/10 z-10">
                    {sItem.episodes && sItem.episodes.length > 0
                      ? `${sItem.seasonsCount || 1}S • ${sItem.episodes.length} Eps`
                      : `${sItem.year}`}
                  </div>
                </div>

                {/* Series Details */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-500 transition line-clamp-1">
                      {sItem.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {sItem.year} • {sItem.seasonsCount || 1}S • {sItem.episodes?.length || 0} Eps
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySeries(sItem);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Series</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
