import React, { useState, useRef } from 'react';
import { HardDrive, Upload, Check, FileVideo } from 'lucide-react';
import { MediaItem } from '../types';

interface BrowseMediaModalProps {
  onSelectMedia: (media: MediaItem, episodeVideoUrl?: string, episodeTitle?: string) => void;
  currentMediaId?: string;
}

export const BrowseMediaModal: React.FC<BrowseMediaModalProps> = ({
  onSelectMedia,
}) => {
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [localFilePreviewUrl, setLocalFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processLocalFile(file);
    }
  };

  const processLocalFile = (file: File) => {
    setSelectedLocalFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLocalFilePreviewUrl(objectUrl);

    // Build a dynamic MediaItem for the local file
    const localMediaItem: MediaItem = {
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      type: 'movie',
      year: new Date().getFullYear(),
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      description: `Local computer video file (${file.name}) - Size: ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      videoUrl: objectUrl,
      audioTracks: [
        { id: 'aud-loc-1', language: 'English [Original]', codec: 'AAC/AC3', channels: '5.1 Surround', label: 'Default Track' },
        { id: 'aud-loc-2', language: 'Spanish / Multi', codec: 'AAC', channels: '2.0 Stereo', label: 'Secondary Track' },
        { id: 'aud-loc-3', language: 'Director Commentary', codec: 'AAC', channels: '2.0 Stereo', label: 'Commentary' },
      ],
      subtitleTracks: [],
      rating: 9.9,
      duration: 'Local File',
      genres: ['Local Media', 'Video File'],
      badge: 'LOCAL FILE',
    };

    // Immediately pass media to player upon selection
    onSelectMedia(localMediaItem);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLocalFile(e.dataTransfer.files[0]);
    }
  };

  const handleReplayLocalFile = () => {
    if (selectedLocalFile && localFilePreviewUrl) {
      processLocalFile(selectedLocalFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 shadow-2xl text-white space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Browse Local Media
            </h3>
            <p className="text-[11px] text-neutral-400">
              Select or drag and drop a local video file from your computer
            </p>
          </div>
        </div>
      </div>

      {/* BROWSE LOCAL MEDIA FROM COMPUTER */}
      <div className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="video/*,.mkv,.mp4,.webm,.avi,.mov,.m4v,.ts"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-red-500 bg-red-600/10'
              : 'border-white/15 bg-neutral-950 hover:border-red-600/60 hover:bg-neutral-950/80'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Drag & Drop Local Video File Here
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              or <span className="text-red-500 font-semibold underline">Click to Browse Computer</span> for .mp4, .mkv, .webm, .avi, .mov files
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-1">
            <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">.mkv</span>
            <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">.mp4</span>
            <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">.webm</span>
            <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">.avi</span>
            <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">.mov</span>
          </div>
        </div>

        {/* Selected File Details & Immediate Playing Indicator */}
        {selectedLocalFile && (
          <div className="bg-neutral-950 border border-red-600/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <h5 className="font-bold text-sm text-white truncate max-w-sm">
                    {selectedLocalFile.name}
                  </h5>
                  <span className="px-2 py-0.5 bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-bold rounded uppercase">
                    Active
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
                  <span>{formatFileSize(selectedLocalFile.size)}</span>
                  <span>•</span>
                  <span className="text-red-400 uppercase font-mono">{selectedLocalFile.type || 'video/mkv'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReplayLocalFile}
              className="w-full sm:w-auto px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 border border-white/10 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4 text-green-500" />
              <span>Loaded & Playing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
