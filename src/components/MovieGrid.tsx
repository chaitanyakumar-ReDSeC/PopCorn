import React from 'react';
import { Play } from 'lucide-react';
import { MediaItem } from '../types';
import { MOVIES_DATA } from '../data/mediaData';

interface MovieGridProps {
  onPlayMovie: (movie: MediaItem) => void;
  searchQuery: string;
  movies?: MediaItem[];
}

export const MovieGrid: React.FC<MovieGridProps> = ({ onPlayMovie, searchQuery, movies }) => {
  const movieList = movies && movies.length > 0 ? movies : MOVIES_DATA;

  // Sort movies in ascending order by year from csv field
  const sortedMovies = React.useMemo(() => {
    return [...movieList].sort((a, b) => {
      const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || '0'), 10) || 0;
      const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || '0'), 10) || 0;
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [movieList]);

  const filteredMovies = sortedMovies.filter((movie) => {
    return (
      !searchQuery ||
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Movies Grid Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-400 tracking-widest uppercase flex items-center space-x-2">
          <span className="w-1.5 h-4 bg-red-600 rounded-sm" />
          <span>Movies Catalog ({filteredMovies.length})</span>
        </h2>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-12 text-center text-neutral-400">
          <p className="text-base font-bold text-white">No Movies Found</p>
          <p className="text-xs mt-1 text-neutral-400">Coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onPlayMovie(movie)}
              className="group bg-neutral-900/90 rounded-xl overflow-hidden border border-white/5 hover:border-red-600/70 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer"
            >
              {/* Poster & Hover Overlay (Aspect 2/3 matching HomePage) */}
              <div className="relative aspect-[2/3] overflow-hidden bg-neutral-950">
                <img
                  src={movie.poster || movie.banner}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                {/* Quick Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Year Badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-neutral-300 border border-white/10">
                  {movie.year}
                </div>
              </div>

              {/* Info Container */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-red-500 transition line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {movie.genres?.slice(0, 2).join(' • ') || `${movie.year} • Movie`}
                  </p>
                </div>

                {/* Direct Play Button */}
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
    </div>
  );
};
