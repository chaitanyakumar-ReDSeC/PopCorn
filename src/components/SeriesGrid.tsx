import React from 'react';
import { Play, Tv } from 'lucide-react';
import { MediaItem } from '../types';
import { SERIES_DATA } from '../data/mediaData';

interface SeriesGridProps {
  onPlaySeries: (series: MediaItem, episodeVideoUrl?: string, episodeTitle?: string) => void;
  searchQuery: string;
  series?: MediaItem[];
}

export const SeriesGrid: React.FC<SeriesGridProps> = ({ onPlaySeries, searchQuery, series }) => {
  const seriesList = series && series.length > 0 ? series : SERIES_DATA;

  const filteredSeries = seriesList.filter((s) => {
    return (
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCardPlay = (sItem: MediaItem) => {
    const episodes = sItem.episodes || [];
    const firstEp = episodes[0];
    onPlaySeries(
      sItem,
      firstEp?.videoUrl,
      firstEp ? `${sItem.title} - S${firstEp.seasonNumber}:E${firstEp.episodeNumber}` : sItem.title
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Series Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-400 tracking-widest uppercase flex items-center space-x-2">
          <span className="w-1.5 h-4 bg-red-600 rounded-sm" />
          <span>Series Catalog ({filteredSeries.length})</span>
        </h2>
      </div>

      {filteredSeries.length === 0 ? (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-12 text-center text-neutral-400">
          <p className="text-base font-bold text-white">No Series Found.</p>
          <p className="text-xs mt-1 text-neutral-400">Coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSeries.map((sItem) => {
            const episodes = sItem.episodes || [];
            const seasons = Array.from(new Set<number>(episodes.map((e) => e.seasonNumber)));
            const seasonsCount = sItem.seasonsCount || seasons.length || 1;

            return (
              <div
                key={sItem.id}
                onClick={() => handleCardPlay(sItem)}
                className="group bg-neutral-900/90 rounded-xl overflow-hidden border border-white/5 hover:border-red-600/70 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer"
              >
                {/* Poster Box (Portrait Aspect 2/3 matching HomePage) */}
                <div className="relative aspect-[2/3] overflow-hidden bg-neutral-950">
                  <img
                    src={sItem.poster || sItem.banner}
                    alt={sItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                  {/* Series Flag Badge */}
                  <div className="absolute top-2 left-2 bg-red-600/95 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white border border-red-400/30 flex items-center space-x-1 shadow-lg z-10">
                    <Tv className="w-2.5 h-2.5 text-white fill-current" />
                    <span>Series</span>
                  </div>

                  {/* Season & Episode Count Tag */}
                  {episodes.length > 0 && (
                    <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-neutral-300 border border-white/10 z-10">
                      {seasonsCount}S • {episodes.length} Eps
                    </div>
                  )}

                  {/* Quick Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-500 transition line-clamp-1">
                      {sItem.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {sItem.year} • {seasonsCount}S • {episodes.length} Eps
                    </p>
                  </div>

                  {/* Direct Play Series Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardPlay(sItem);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Series</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
