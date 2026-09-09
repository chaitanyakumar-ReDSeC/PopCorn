/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MovieGrid } from './components/MovieGrid';
import { SeriesGrid } from './components/SeriesGrid';
import { PrivateScreen } from './components/PrivateScreen';
import { PrivateScreenModal } from './components/PrivateScreenModal';
import { ViewMode, MediaItem } from './types';
import { fetchMoviesFromCSV, fetchSeriesFromCSV } from './utils/csvLoader';
import { stopAllGlobalPlayback } from './utils/mediaControl';

const DEFAULT_EMPTY_MEDIA: MediaItem = {
  id: 'none',
  title: 'No Media Loaded',
  type: 'movie',
  year: 2026,
  rating: 0,
  genres: [],
  poster: '',
  banner: '',
  description: 'Load a local video file from your computer or stream URL to play.',
  videoUrl: '',
  audioTracks: [],
  subtitleTracks: [],
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  // Separate search bars for Home, Movies, and Series
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [moviesSearchQuery, setMoviesSearchQuery] = useState('');
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('');

  const [selectedMedia, setSelectedMedia] = useState<MediaItem>(DEFAULT_EMPTY_MEDIA);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);

  // Loaded CSV media items
  const [moviesList, setMoviesList] = useState<MediaItem[]>([]);
  const [seriesList, setSeriesList] = useState<MediaItem[]>([]);

  const loadAllCSVData = async () => {
    try {
      const loadedMovies = await fetchMoviesFromCSV();
      const loadedSeries = await fetchSeriesFromCSV();
      setMoviesList(loadedMovies);
      setSeriesList(loadedSeries);
    } catch (e) {
      console.error('Failed to load CSVs:', e);
    }
  };

  useEffect(() => {
    loadAllCSVData();
    // Auto refresh CSV data every 10 seconds to catch any new row entries automatically
    const interval = setInterval(loadAllCSVData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handler to launch Private Screen with a specific movie or episode
  const handleLaunchPrivateScreen = (media: MediaItem, customVideoUrl?: string, customTitle?: string) => {
    stopAllGlobalPlayback();
    const finalVideoUrl = customVideoUrl || media.videoUrl;
    const updatedAudioTracks = (media.audioTracks || []).map((t) =>
      t.isOriginal || t.id === 'orig' ? { ...t, videoUrl: finalVideoUrl } : t
    );
    setSelectedMedia({
      ...media,
      videoUrl: finalVideoUrl,
      title: customTitle || media.title,
      audioTracks: updatedAudioTracks,
    });
    setViewMode('private_screen');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-neutral-900 text-white font-sans antialiased selection:bg-red-600 selection:text-white flex flex-col">
      {/* Top Header Navigation */}
      <Header
        currentMode={viewMode}
        onSelectMode={(mode) => {
          stopAllGlobalPlayback();
          if (mode === 'private_screen') {
            setIsPrivateModalOpen(true);
            return;
          }
          setViewMode(mode);
        }}
        onOpenPrivateScreenModal={() => setIsPrivateModalOpen(true)}
        homeSearchQuery={homeSearchQuery}
        onHomeSearchChange={setHomeSearchQuery}
        moviesSearchQuery={moviesSearchQuery}
        onMoviesSearchChange={setMoviesSearchQuery}
        seriesSearchQuery={seriesSearchQuery}
        onSeriesSearchChange={setSeriesSearchQuery}
        moviesCount={moviesList.length}
        seriesCount={seriesList.length}
        movies={moviesList}
        series={seriesList}
        onPlayMovie={(movie) => handleLaunchPrivateScreen(movie)}
        onPlaySeries={(seriesItem, videoUrl, title) =>
          handleLaunchPrivateScreen(seriesItem, videoUrl, title)
        }
      />

      {/* Global Private Screen Pop-up Options Modal */}
      <PrivateScreenModal
        isOpen={isPrivateModalOpen}
        onClose={() => setIsPrivateModalOpen(false)}
        onLaunchMedia={(media) => handleLaunchPrivateScreen(media)}
      />

      {/* Main View Container */}
      <main className="px-4 sm:px-8 py-6 flex-1">
        {viewMode === 'home' && (
          <HomePage
            movies={moviesList}
            series={seriesList}
            onPlayMovie={(movie) => handleLaunchPrivateScreen(movie)}
            onPlaySeries={(seriesItem, videoUrl, title) =>
              handleLaunchPrivateScreen(seriesItem, videoUrl, title)
            }
            onNavigateTab={(tab) => setViewMode(tab)}
          />
        )}

        {viewMode === 'movies' && (
          <div className="max-w-7xl mx-auto">
            <MovieGrid
              movies={moviesList}
              onPlayMovie={(movie) => handleLaunchPrivateScreen(movie)}
              searchQuery={moviesSearchQuery}
            />
          </div>
        )}

        {viewMode === 'series' && (
          <div className="max-w-7xl mx-auto">
            <SeriesGrid
              series={seriesList}
              onPlaySeries={(seriesItem, videoUrl, title) =>
                handleLaunchPrivateScreen(seriesItem, videoUrl, title)
              }
              searchQuery={seriesSearchQuery}
            />
          </div>
        )}

        {viewMode === 'private_screen' && (
          <PrivateScreen
            initialMedia={selectedMedia}
            onExitPrivateScreen={() => setViewMode('home')}
            onNavigateTab={(tab) => setViewMode(tab)}
          />
        )}
      </main>

      {/* Sleek Interface Footer Status Bar */}
      <footer className="h-10 bg-neutral-950 border-t border-white/5 flex items-center justify-between px-6 text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-auto">
        <div className="flex items-center gap-1.5">
          <img
            src="https://raw.githubusercontent.com/chaitanyakumar-ReDSeC/assets/main/general/image_assets/static/popcorn.png"
            alt="Popcorn"
            className="w-6 h-6 object-contain"
          />
          <span>POPCORN</span>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/chaitanyakumar-ReDSeC"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-red-600 hover:text-white transition-all duration-200"
            title="Visit GitHub Profile"
          >
            <img
              src="https://cdn.simpleicons.org/github/ffffff"
              alt="GitHub"
              className="w-4 h-4"
            />
            <span>chaitanyakumar-ReDSeC</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
