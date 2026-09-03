import React, { useState, useEffect } from 'react';
import {
  Link2,
  ShieldCheck,
  X,
  HardDrive,
  Shield,
  Film,
  Tv,
  Square,
  Sparkles,
  Volume2,
  Captions,
  ArrowRight,
  Home as HomeIcon,
  Clock,
  SkipForward,
  ListVideo
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { AudioCard } from './AudioCard';
import { SubtitleCard } from './SubtitleCard';
import { BrowseMediaModal } from './BrowseMediaModal';
import { StreamMediaForm } from './StreamMediaForm';
import { AudioTrackFlagChecker } from './AudioTrackFlagChecker';
import { MediaItem, PlaybackSpeed, AudioTrack, SubtitleTrack, Episode } from '../types';
import { stopAllGlobalPlayback } from '../utils/mediaControl';

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

interface PrivateScreenProps {
  initialMedia?: MediaItem;
  onExitPrivateScreen: () => void;
  onNavigateTab?: (tab: 'home' | 'movies' | 'series') => void;
  forceOpenOptions?: boolean;
}

export const PrivateScreen: React.FC<PrivateScreenProps> = ({
  initialMedia = DEFAULT_EMPTY_MEDIA,
  onExitPrivateScreen,
  onNavigateTab,
  forceOpenOptions = false,
}) => {
  const hasValidInitial = Boolean(initialMedia && initialMedia.id !== 'none' && initialMedia.videoUrl);
  const mediaToUse = hasValidInitial ? initialMedia : DEFAULT_EMPTY_MEDIA;

  // Current playing media state
  const [currentMedia, setCurrentMedia] = useState<MediaItem>(mediaToUse);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(mediaToUse.videoUrl);
  const [activeTitle, setActiveTitle] = useState<string>(mediaToUse.title);

  // Player state
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState<string>(
    mediaToUse.audioTracks[0]?.id || ''
  );
  const [activeSubtitleTrackId, setActiveSubtitleTrackId] = useState<string | null>(
    mediaToUse.subtitleTracks[0]?.id || null
  );
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);

  // Media playback state
  const [isMediaPlaying, setIsMediaPlaying] = useState<boolean>(false);

  // Private Screen Pop-up Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!hasValidInitial || forceOpenOptions);
  const [modalStep, setModalStep] = useState<'choose' | 'browse' | 'stream'>('choose');

  // Stop Screening 15-second countdown timer state
  const [countdown, setCountdown] = useState<number | null>(null);

  // Sync state when initialMedia prop changes
  useEffect(() => {
    if (initialMedia && initialMedia.id !== 'none' && initialMedia.videoUrl) {
      setCurrentMedia(initialMedia);
      setActiveVideoUrl(initialMedia.videoUrl);
      setActiveTitle(initialMedia.title);
      if (initialMedia.audioTracks.length > 0) {
        setActiveAudioTrackId(initialMedia.audioTracks[0].id);
      }
      if (initialMedia.subtitleTracks.length > 0) {
        setActiveSubtitleTrackId(initialMedia.subtitleTracks[0].id);
        setSubtitlesEnabled(true);
      }
      setIsModalOpen(false);
      setCountdown(null);
    } else if (!initialMedia || initialMedia.id === 'none') {
      setCurrentMedia(DEFAULT_EMPTY_MEDIA);
      setActiveVideoUrl('');
      setActiveTitle('');
      setIsModalOpen(false);
      setCountdown(15);
    }
  }, [initialMedia]);

  const hasMedia = currentMedia.id !== 'none' && Boolean(activeVideoUrl);

  // 15-second countdown timer for Stop Screening prompt
  useEffect(() => {
    if (hasMedia || countdown === null) return;
    if (isModalOpen && modalStep !== 'choose') {
      // Pause countdown if user is actively filling stream URL or browsing files
      return;
    }

    if (countdown <= 0) {
      // Auto redirect to Home
      if (onNavigateTab) {
        onNavigateTab('home');
      } else {
        onExitPrivateScreen();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, hasMedia, isModalOpen, modalStep, onNavigateTab, onExitPrivateScreen]);

  // Handlers
  const handleSelectMediaFromCatalog = (
    media: MediaItem,
    episodeVideoUrl?: string,
    episodeTitle?: string
  ) => {
    setCurrentMedia(media);
    const urlToPlay = episodeVideoUrl || media.videoUrl;
    setActiveVideoUrl(urlToPlay);
    setActiveTitle(episodeTitle || media.title);
    if (media.audioTracks.length > 0) {
      setActiveAudioTrackId(media.audioTracks[0].id);
    }
    if (media.subtitleTracks.length > 0) {
      setActiveSubtitleTrackId(media.subtitleTracks[0].id);
      setSubtitlesEnabled(true);
    }
    setIsMediaPlaying(false);
    setIsModalOpen(false);
    setCountdown(null);
  };

  const handleStreamUrlSubmit = (url: string, mediaName?: string) => {
    const directMedia: MediaItem = {
      id: `stream-${Date.now()}`,
      title: mediaName || 'Direct Media Stream',
      type: 'movie',
      year: new Date().getFullYear(),
      rating: 0,
      genres: ['Custom Stream'],
      poster: '',
      banner: '',
      description: 'Streamed directly via custom URL in PopCorn Private Screen.',
      videoUrl: url,
      audioTracks: [
        {
          id: 'orig',
          language: 'Original',
          label: 'Original Audio (Embedded)',
          channels: 'Stereo / 5.1',
          codec: 'Native',
          videoUrl: url,
          isOriginal: true,
          isDefault: true,
        }
      ],
      subtitleTracks: [],
    };
    setCurrentMedia(directMedia);
    setActiveVideoUrl(url);
    setActiveTitle(mediaName || 'Direct Stream');
    setActiveAudioTrackId('orig');
    setIsMediaPlaying(false);
    setIsModalOpen(false);
    setCountdown(null);
  };

  // Stop all media when PrivateScreen unmounts
  useEffect(() => {
    return () => {
      stopAllGlobalPlayback();
    };
  }, []);

  const handleStopScreening = () => {
    stopAllGlobalPlayback();
    setCurrentMedia(DEFAULT_EMPTY_MEDIA);
    setActiveVideoUrl('');
    setActiveTitle('');
    setIsMediaPlaying(false);
    setActiveAudioTrackId('');
    setActiveSubtitleTrackId(null);
    setIsModalOpen(false);
    setCountdown(15); // Start 15s countdown
  };

  const handlePlaybackStateChange = (playing: boolean) => {
    setIsMediaPlaying(playing);
  };

  const handleTracksExtracted = (
    extractedAudio?: AudioTrack[],
    extractedSubs?: SubtitleTrack[]
  ) => {
    if (extractedAudio && extractedAudio.length > 0) {
      setCurrentMedia((prev) => {
        // If current media already has multi-tracks defined, do not wipe them
        const hasExisting = prev.audioTracks.some((t) => Boolean(t.src || t.videoUrl));
        if (hasExisting) return prev;
        return {
          ...prev,
          audioTracks: extractedAudio,
        };
      });
      setActiveAudioTrackId((prev) => prev || extractedAudio[0].id);
    }

    if (extractedSubs && extractedSubs.length > 0) {
      setCurrentMedia((prev) => {
        // CRITICAL: Preserve any subtitle tracks that already have an external src (like from CSV or file upload)
        const existingWithSrc = prev.subtitleTracks.filter((t) => Boolean(t.src));
        if (existingWithSrc.length > 0) {
          const nonDuplicateExtracted = extractedSubs.filter(
            (es) => !existingWithSrc.some((ex) => ex.id === es.id || ex.language === es.language)
          );
          return {
            ...prev,
            subtitleTracks: [...existingWithSrc, ...nonDuplicateExtracted],
          };
        }
        return {
          ...prev,
          subtitleTracks: extractedSubs,
        };
      });
    }
  };

  const handleAddSubtitleTrack = (newTrack: SubtitleTrack) => {
    setCurrentMedia((prev) => ({
      ...prev,
      subtitleTracks: [...prev.subtitleTracks, newTrack],
    }));
    setActiveSubtitleTrackId(newTrack.id);
    setSubtitlesEnabled(true);
  };

  const activeAudioTrack =
    currentMedia.audioTracks.find((t) => t.id === activeAudioTrackId) ||
    currentMedia.audioTracks[0];

  const activeSubtitleTrack =
    currentMedia.subtitleTracks.find((t) => t.id === activeSubtitleTrackId);

  // Series episode management
  const isSeries =
    currentMedia.type === 'series' &&
    Boolean(currentMedia.episodes && currentMedia.episodes.length > 0);
  const currentEpisodes = currentMedia.episodes || [];
  const currentEpIdx = currentEpisodes.findIndex(
    (e) => e.videoUrl === activeVideoUrl
  );
  const currentEpisode =
    currentEpIdx >= 0 ? currentEpisodes[currentEpIdx] : currentEpisodes[0];
  const nextEpisode =
    currentEpIdx >= 0 && currentEpIdx < currentEpisodes.length - 1
      ? currentEpisodes[currentEpIdx + 1]
      : null;

  // Unique seasons list
  const availableSeasons = Array.from(
    new Set<number>(currentEpisodes.map((e) => e.seasonNumber))
  ).sort((a, b) => a - b);
  const [playerSelectedSeason, setPlayerSelectedSeason] = useState<number>(1);

  // Keep player season in sync when current playing episode changes
  useEffect(() => {
    if (currentEpisode) {
      setPlayerSelectedSeason(currentEpisode.seasonNumber);
    }
  }, [currentEpisode?.seasonNumber]);

  const handleSwitchEpisode = (ep: Episode) => {
    setActiveVideoUrl(ep.videoUrl);
    setActiveTitle(`${currentMedia.title} - S${ep.seasonNumber}:E${ep.episodeNumber}`);
    setPlayerSelectedSeason(ep.seasonNumber);
    setCurrentMedia((prev) => ({
      ...prev,
      videoUrl: ep.videoUrl,
      audioTracks: [
        {
          id: 'orig',
          language: 'Original',
          label: 'Original Audio',
          channels: 'Embedded Multi-Track',
          codec: 'AAC/AC3',
          videoUrl: ep.videoUrl,
          isOriginal: true,
          isDefault: true,
        },
      ],
    }));
    setActiveAudioTrackId('orig');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ACTIVE MEDIA SCREENING VIEW */}
      {hasMedia ? (
        <div className="space-y-6">
          {/* Top Session Bar with Stop Screening Button */}
          <div className="flex items-center justify-between bg-neutral-900 border border-white/10 px-3.5 sm:px-5 py-3 sm:py-3.5 rounded-xl shadow-2xl flex-wrap gap-2.5 sm:gap-3">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isMediaPlaying ? 'bg-red-600 animate-ping' : 'bg-red-500'}`} />
              <div className="min-w-0">
                <h2 className="text-xs sm:text-base font-bold text-white tracking-wide truncate max-w-[180px] xs:max-w-xs sm:max-w-md md:max-w-xl">
                  {activeTitle}
                </h2>
                <div className="flex items-center space-x-1.5 sm:space-x-2 text-[9px] sm:text-[10px] text-neutral-400 truncate">
                  <span className="text-red-500 font-bold uppercase tracking-wider">Private Screen</span>
                  <span>•</span>
                  <span>Audio: {activeAudioTrack?.language || 'Default'}</span>
                  {subtitlesEnabled && activeSubtitleTrack && (
                    <>
                      <span>•</span>
                      <span>Sub: {activeSubtitleTrack.language}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top Action Buttons: Next Episode & Stop Screening */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {nextEpisode && (
                <button
                  onClick={() => handleSwitchEpisode(nextEpisode)}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  title={`Play Next Episode: S${nextEpisode.seasonNumber}:E${nextEpisode.episodeNumber}`}
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Next (S{nextEpisode.seasonNumber}:E{nextEpisode.episodeNumber})</span>
                  <span className="sm:hidden">Next Ep</span>
                </button>
              )}

              {/* Stop Screening Button */}
              <button
                onClick={handleStopScreening}
                className="flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-red-600 text-neutral-300 hover:text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-red-600 transition-all cursor-pointer shadow-lg"
                title="Stop playback and return to Private Screen menu"
              >
                <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-red-500 hover:text-white shrink-0" />
                <span className="hidden xs:inline">Stop Screening</span>
                <span className="xs:hidden">Stop Screening</span>
              </button>
            </div>
          </div>

          {/* Primary Video Player Container */}
          <div className="space-y-4">
            <VideoPlayer
              src={activeVideoUrl}
              title={activeTitle}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
              subtitlesEnabled={subtitlesEnabled}
              onToggleSubtitles={(enabled) => setSubtitlesEnabled(enabled)}
              activeSubtitleTrack={activeSubtitleTrack}
              activeAudioTrack={activeAudioTrack}
              onPlaybackStateChange={handlePlaybackStateChange}
              onTracksExtracted={handleTracksExtracted}
            />
          </div>

          {/* Series Episode & Season Navigator Drawer */}
          {isSeries && currentEpisodes.length > 0 && (
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <ListVideo className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Episodes in this Series
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {currentMedia.title} • {availableSeasons.length} Season{availableSeasons.length > 1 ? 's' : ''} • {currentEpisodes.length} Episodes
                    </p>
                  </div>
                </div>

                {/* Season Tabs */}
                {availableSeasons.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {availableSeasons.map((sNum) => {
                      const isTabActive = playerSelectedSeason === sNum;
                      const epCount = currentEpisodes.filter(
                        (e) => e.seasonNumber === sNum
                      ).length;
                      return (
                        <button
                          key={sNum}
                          onClick={() => setPlayerSelectedSeason(sNum)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                            isTabActive
                              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                              : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10'
                          }`}
                        >
                          <span>Season {sNum}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isTabActive
                                ? 'bg-black/30 text-white'
                                : 'bg-white/10 text-neutral-400'
                            }`}
                          >
                            {epCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Episode Buttons Grid for the selected season */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {currentEpisodes
                  .filter((ep) => ep.seasonNumber === playerSelectedSeason)
                  .map((ep) => {
                    const isPlaying = activeVideoUrl === ep.videoUrl;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => handleSwitchEpisode(ep)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                          isPlaying
                            ? 'bg-red-950/50 border-red-600 shadow-lg shadow-red-600/30 text-white ring-1 ring-red-600'
                            : 'bg-neutral-950/70 border-white/5 hover:border-red-600/50 text-neutral-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs w-full">
                          <span
                            className={`font-mono font-bold ${
                              isPlaying ? 'text-red-400' : 'text-neutral-400'
                            }`}
                          >
                            S{ep.seasonNumber}:E{ep.episodeNumber}
                          </span>
                          {isPlaying && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                              Playing
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold truncate w-full">
                          {ep.title}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Audio & Subtitle Cards - Multi-Track Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio Card */}
            <AudioCard
              tracks={currentMedia.audioTracks}
              activeTrackId={activeAudioTrackId}
              onSelectTrack={(id) => setActiveAudioTrackId(id)}
            />

            {/* Subtitle Card */}
            <SubtitleCard
              tracks={currentMedia.subtitleTracks}
              activeSubtitleId={activeSubtitleTrackId}
              subtitlesEnabled={subtitlesEnabled}
              onToggleSubtitles={(enabled) => setSubtitlesEnabled(enabled)}
              onSelectSubtitle={(id) => setActiveSubtitleTrackId(id)}
              onAddSubtitleTrack={handleAddSubtitleTrack}
            />
          </div>

          {/* Technical Details Footer Panel */}
          <div className="bg-neutral-900 border border-white/5 rounded-xl p-5 text-neutral-300 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">
                  {currentMedia.title}
                </h4>
              </div>
              <p className="text-xs text-neutral-400 line-clamp-2">{currentMedia.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-neutral-950 border border-white/5 px-3 py-1 rounded text-neutral-300 font-mono">
                Speed: {playbackSpeed}x
              </span>
              <span className="bg-neutral-950 border border-white/5 px-3 py-1 rounded text-neutral-300">
                Audio: {activeAudioTrack?.language}
              </span>
              <span className="bg-neutral-950 border border-white/5 px-3 py-1 rounded text-neutral-300">
                Subtitles: {subtitlesEnabled ? activeSubtitleTrack?.language : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SCREENING STOPPED / LAUNCHER VIEW WITH 15-SEC TIMER */
        <div className="space-y-8 py-4">
          {/* Hero Welcome & Countdown Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-white/10 p-8 sm:p-12 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" />
              <span>Private Screening</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Screening Finished
            </h1>

            <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto">
              Choose an option below to play another media file or stream via URL.
            </p>

            {/* Countdown Badge & Dedicated Home Button */}
            {countdown !== null && (
              <div className="inline-flex items-center gap-3 bg-neutral-900/90 border border-white/10 px-5 py-2.5 rounded-2xl shadow-xl">
                <div className="flex items-center space-x-2 text-xs text-neutral-300 font-medium">
                  <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>Redirecting to Home in:</span>
                  <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                    {countdown}s
                  </span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('home');
                    else onExitPrivateScreen();
                  }}
                  className="flex items-center space-x-1.5 text-xs font-bold text-neutral-200 hover:text-white bg-white/5 hover:bg-red-600 px-3 py-1.5 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  <HomeIcon className="w-3.5 h-3.5 text-red-400 hover:text-white" />
                  <span>Go to Home Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Clean 2-Option Card Grid: Local Media vs Stream URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Choice 1: Choose a Local Media */}
            <div
              onClick={() => {
                setModalStep('browse');
                setIsModalOpen(true);
              }}
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-white/10 hover:border-red-600 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all shadow-xl group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <HardDrive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    Choose a Local Media
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Select or drag & drop video files (<span className="text-neutral-200">.mp4</span>, <span className="text-neutral-200">.mkv</span>, <span className="text-neutral-200">.webm</span>) directly from your computer for lag-free local playback.
                  </p>
                </div>
              </div>

              <div className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-neutral-950 group-hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider border border-white/10 group-hover:border-red-600 transition-all shadow-lg">
                <span>Select Local File</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Choice 2: Stream Through URL */}
            <div
              onClick={() => {
                setModalStep('stream');
                setIsModalOpen(true);
              }}
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-white/10 hover:border-red-600 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all shadow-xl group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <Link2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    Stream Through URL
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Paste any direct video link or HTTP media stream to play immediately in Private Screen with subtitle synchronization.
                  </p>
                </div>
              </div>

              <div className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-neutral-950 group-hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider border border-white/10 group-hover:border-red-600 transition-all shadow-lg">
                <span>Enter Stream URL</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Return to Catalog Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-neutral-950 border border-white/5 rounded-2xl p-5 gap-4">
            <div className="flex items-center space-x-3 text-xs text-neutral-400">
              <Film className="w-4 h-4 text-red-500" />
              <span>Or explore our online catalog instead:</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('movies');
                  else onExitPrivateScreen();
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold border border-white/10 hover:border-red-500 transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-red-500" />
                <span>Movies Catalog</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('series');
                  else onExitPrivateScreen();
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold border border-white/10 hover:border-red-500 transition cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5 text-red-500" />
                <span>Series Catalog</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('home');
                  else onExitPrivateScreen();
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL OVERLAY FOR PRIVATE SCREEN OPTIONS */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative my-auto cursor-default"
          >
            {/* Modal Top Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              {modalStep !== 'choose' ? (
                <button
                  onClick={() => setModalStep('choose')}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer border border-white/10"
                >
                  <ArrowRight className="w-4 h-4 text-red-500 rotate-180" />
                  <span>Back to Options</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                    Private Screen Options
                  </h2>
                </div>
              )}

              {/* Close Button in top right corner of modal */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer border border-white/5"
                title="Close Options"
                aria-label="Close Options"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: CHOOSE OPTIONS (Choose a Local Media vs Stream Through URL) */}
            {modalStep === 'choose' && (
              <div className="space-y-4">
                {/* Browser Flag Checker for Multiple Audio Tracks at the TOP */}
                <AudioTrackFlagChecker />

                <div className="text-center space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-white">Select Media Source</h3>
                  <p className="text-xs text-neutral-400">
                    Choose how you want to load media into Private Screen
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Choose a Local Media */}
                  <button
                    onClick={() => setModalStep('browse')}
                    className="p-6 rounded-2xl bg-neutral-950 border border-white/10 hover:border-red-600 hover:bg-neutral-900 cursor-pointer transition-all flex flex-col items-center text-center space-y-3 group shadow-xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <HardDrive className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-red-400 transition-colors">
                        Choose a Local Media
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        Select or drag & drop a local video file (.mp4, .mkv, .webm) from your computer
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Stream Through URL */}
                  <button
                    onClick={() => setModalStep('stream')}
                    className="p-6 rounded-2xl bg-neutral-950 border border-white/10 hover:border-red-600 hover:bg-neutral-900 cursor-pointer transition-all flex flex-col items-center text-center space-y-3 group shadow-xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <Link2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-red-400 transition-colors">
                        Stream Through URL
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        Enter a direct stream URL or video link to stream instantly
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BROWSE MEDIA FILE UPLOAD */}
            {modalStep === 'browse' && (
              <BrowseMediaModal
                onSelectMedia={handleSelectMediaFromCatalog}
                currentMediaId={currentMedia.id}
              />
            )}

            {/* STEP 3: STREAM MEDIA URL FORM */}
            {modalStep === 'stream' && (
              <StreamMediaForm
                onStreamUrlSubmit={handleStreamUrlSubmit}
                currentUrl={activeVideoUrl}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
