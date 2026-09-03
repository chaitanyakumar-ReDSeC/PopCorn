import React, { useState } from 'react';
import { Shield, X, HardDrive, Link2, ArrowRight } from 'lucide-react';
import { BrowseMediaModal } from './BrowseMediaModal';
import { StreamMediaForm } from './StreamMediaForm';
import { AudioTrackFlagChecker } from './AudioTrackFlagChecker';
import { MediaItem } from '../types';

interface PrivateScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchMedia: (media: MediaItem) => void;
}

export const PrivateScreenModal: React.FC<PrivateScreenModalProps> = ({
  isOpen,
  onClose,
  onLaunchMedia,
}) => {
  const [modalStep, setModalStep] = useState<'choose' | 'browse' | 'stream'>('choose');

  if (!isOpen) return null;

  const handleSelectMedia = (
    media: MediaItem,
    episodeVideoUrl?: string,
    episodeTitle?: string
  ) => {
    if (episodeVideoUrl || episodeTitle) {
      onLaunchMedia({
        ...media,
        videoUrl: episodeVideoUrl || media.videoUrl,
        title: episodeTitle || media.title,
      });
    } else {
      onLaunchMedia(media);
    }
    setModalStep('choose');
    onClose();
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
        },
      ],
      subtitleTracks: [],
    };
    onLaunchMedia(directMedia);
    setModalStep('choose');
    onClose();
  };

  const handleModalClose = () => {
    setModalStep('choose');
    onClose();
  };

  return (
    <div
      onClick={handleModalClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer animate-fadeIn"
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

          {/* Close Button in top right corner */}
          <button
            onClick={handleModalClose}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer border border-white/5"
            title="Close Options"
            aria-label="Close Options"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CHOOSE OPTIONS */}
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

        {/* STEP 2: BROWSE LOCAL FILE */}
        {modalStep === 'browse' && (
          <BrowseMediaModal onSelectMedia={handleSelectMedia} />
        )}

        {/* STEP 3: STREAM URL */}
        {modalStep === 'stream' && (
          <StreamMediaForm onStreamUrlSubmit={handleStreamUrlSubmit} />
        )}
      </div>
    </div>
  );
};
