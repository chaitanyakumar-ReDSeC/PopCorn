import React, { useState, useRef } from 'react';
import {
  HardDrive,
  Upload,
  Check,
  FileVideo,
  Volume2,
  Plus,
  Trash2,
  Subtitles,
  Loader2,
  Sparkles,
  Music,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MediaItem, AudioTrack, SubtitleTrack } from '../types';
import { detectMediaTracksFromFile, formatLanguageName } from '../utils/mediaTrackDetector';

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
  const [isScanning, setIsScanning] = useState(false);
  const [detectedAudioTracks, setDetectedAudioTracks] = useState<AudioTrack[]>([]);
  const [detectedSubtitleTracks, setDetectedSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [externalAudioTracks, setExternalAudioTracks] = useState<AudioTrack[]>([]);
  const [externalSubtitles, setExternalSubtitles] = useState<SubtitleTrack[]>([]);
  const [extraAudioLanguage, setExtraAudioLanguage] = useState('Secondary Audio');
  const [showAddAudioPrompt, setShowAddAudioPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);

  const processLocalFile = async (file: File) => {
    setSelectedLocalFile(file);
    setIsScanning(true);

    const objectUrl = URL.createObjectURL(file);
    setLocalFilePreviewUrl(objectUrl);

    // Detect real embedded audio and subtitle tracks from media container
    const { audioTracks, subtitleTracks } = await detectMediaTracksFromFile(file);

    // Associate videoUrl with original track
    const finalAudioTracks = audioTracks.map((t) => ({
      ...t,
      videoUrl: t.isOriginal ? objectUrl : t.videoUrl,
    }));

    setDetectedAudioTracks(finalAudioTracks);
    setDetectedSubtitleTracks(subtitleTracks);
    setIsScanning(false);

    // Build MediaItem with real detected tracks
    const allAudio = [...finalAudioTracks, ...externalAudioTracks];
    const allSubs = [...subtitleTracks, ...externalSubtitles];

    const localMediaItem: MediaItem = {
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: 'movie',
      year: new Date().getFullYear(),
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      description: `Local storage video (${file.name}) • ${formatFileSize(file.size)} • ${finalAudioTracks.length} Audio Track${finalAudioTracks.length > 1 ? 's' : ''} Detected`,
      videoUrl: objectUrl,
      audioTracks: allAudio,
      subtitleTracks: allSubs,
      rating: 9.9,
      duration: 'Local Media',
      genres: ['Local Media', 'Video File'],
      badge: 'LOCAL MEDIA',
    };

    onSelectMedia(localMediaItem);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLocalFile(e.target.files[0]);
    }
  };

  // Handler for adding external auxiliary audio track (e.g., .mp3, .m4a, .aac, .wav)
  const handleAddExternalAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const audioFile = e.target.files[0];
      const audioUrl = URL.createObjectURL(audioFile);
      const newTrack: AudioTrack = {
        id: `aud-ext-${Date.now()}`,
        language: extraAudioLanguage || audioFile.name.replace(/\.[^/.]+$/, ''),
        label: `${extraAudioLanguage} (${audioFile.name})`,
        channels: 'Stereo (2.0)',
        codec: audioFile.name.split('.').pop()?.toUpperCase() || 'AUDIO',
        src: audioUrl,
        isOriginal: false,
        isDefault: false,
      };

      const updatedExternal = [...externalAudioTracks, newTrack];
      setExternalAudioTracks(updatedExternal);
      setShowAddAudioPrompt(false);

      // Re-trigger onSelectMedia to include newly added audio track
      if (selectedLocalFile && localFilePreviewUrl) {
        syncUpdatedMedia(updatedExternal, externalSubtitles);
      }
    }
  };

  // Handler for adding external subtitle track (.srt, .vtt)
  const handleAddExternalSubtitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const subFile = e.target.files[0];
      const subUrl = URL.createObjectURL(subFile);
      const newSub: SubtitleTrack = {
        id: `sub-ext-${Date.now()}`,
        language: subFile.name.replace(/\.[^/.]+$/, ''),
        label: subFile.name,
        src: subUrl,
        isDefault: false,
      };

      const updatedSubs = [...externalSubtitles, newSub];
      setExternalSubtitles(updatedSubs);

      if (selectedLocalFile && localFilePreviewUrl) {
        syncUpdatedMedia(externalAudioTracks, updatedSubs);
      }
    }
  };

  const removeExternalAudioTrack = (trackId: string) => {
    const updated = externalAudioTracks.filter((t) => t.id !== trackId);
    setExternalAudioTracks(updated);
    if (selectedLocalFile && localFilePreviewUrl) {
      syncUpdatedMedia(updated, externalSubtitles);
    }
  };

  const removeExternalSubtitle = (subId: string) => {
    const updated = externalSubtitles.filter((s) => s.id !== subId);
    setExternalSubtitles(updated);
    if (selectedLocalFile && localFilePreviewUrl) {
      syncUpdatedMedia(externalAudioTracks, updated);
    }
  };

  const syncUpdatedMedia = (audioList: AudioTrack[], subList: SubtitleTrack[]) => {
    if (!selectedLocalFile || !localFilePreviewUrl) return;

    const allAudio = [...detectedAudioTracks, ...audioList];
    const allSubs = [...detectedSubtitleTracks, ...subList];

    const updatedMedia: MediaItem = {
      id: `local-${Date.now()}`,
      title: selectedLocalFile.name.replace(/\.[^/.]+$/, ''),
      type: 'movie',
      year: new Date().getFullYear(),
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      description: `Local storage video (${selectedLocalFile.name}) • ${formatFileSize(selectedLocalFile.size)} • ${allAudio.length} Audio Track${allAudio.length > 1 ? 's' : ''}`,
      videoUrl: localFilePreviewUrl,
      audioTracks: allAudio,
      subtitleTracks: allSubs,
      rating: 9.9,
      duration: 'Local Media',
      genres: ['Local Media', 'Video File'],
      badge: 'LOCAL MEDIA',
    };

    onSelectMedia(updatedMedia);
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
    if (selectedLocalFile) {
      processLocalFile(selectedLocalFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const totalAudioCount = detectedAudioTracks.length + externalAudioTracks.length;

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl text-white space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Browse Local Media & Multi-Audio
            </h3>
            <p className="text-[11px] text-neutral-400">
              Select video file from your computer — automatically scans and loads all embedded audio tracks
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*,.mkv,.mp4,.webm,.avi,.mov,.m4v,.ts"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*,.mp3,.m4a,.aac,.wav,.ac3,.ogg,.flac"
        onChange={handleAddExternalAudio}
        className="hidden"
      />
      <input
        type="file"
        ref={subtitleInputRef}
        accept=".srt,.vtt,.ass"
        onChange={handleAddExternalSubtitle}
        className="hidden"
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-red-500 bg-red-600/10 scale-[0.99]'
            : 'border-white/15 bg-neutral-950 hover:border-red-600/60 hover:bg-neutral-950/80'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
          <Upload className="w-6 h-6" />
        </div>

        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">
            Drag & Drop Local Video File Here
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            or <span className="text-red-500 font-semibold underline">Click to Browse Computer</span> for .mkv, .mp4, .webm, .mov
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono mt-1 flex-wrap justify-center">
          <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-neutral-300">.mkv</span>
          <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-neutral-300">.mp4</span>
          <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-neutral-300">.webm</span>
          <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-neutral-300">.mov</span>
          <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-neutral-300">.avi</span>
          <span className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded border border-red-500/30 font-semibold">Multi-Audio Enabled</span>
        </div>
      </div>

      {/* Scanning status banner */}
      {isScanning && (
        <div className="bg-neutral-950 border border-red-500/40 rounded-xl p-4 flex items-center space-x-3 text-red-400 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">Scanning Media Container...</p>
            <p className="text-neutral-400 text-[11px] mt-0.5">
              Demuxing audio streams, identifying audio languages, channels, and codecs.
            </p>
          </div>
        </div>
      )}

      {/* Selected File Details & Detected Multi-Audio Tracks */}
      {selectedLocalFile && !isScanning && (
        <div className="space-y-4">
          {/* Active File Card */}
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
                  <span className="px-2 py-0.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Loaded</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
                  <span>{formatFileSize(selectedLocalFile.size)}</span>
                  <span>•</span>
                  <span className="text-red-400 uppercase font-mono">{selectedLocalFile.type || 'video/container'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{totalAudioCount} Audio Track{totalAudioCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReplayLocalFile}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-1.5 shadow-lg cursor-pointer transition-all shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Loaded & Active</span>
            </button>
          </div>

          {/* DETECTED AUDIO TRACKS SECTION */}
          <div className="bg-neutral-950 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-red-500" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                  Multi-Audio Tracks Detected ({totalAudioCount})
                </h5>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAudioPrompt(!showAddAudioPrompt)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded text-[11px] font-semibold flex items-center space-x-1 transition border border-white/10 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-red-500" />
                  <span>Add External Audio File</span>
                </button>

                <button
                  type="button"
                  onClick={() => subtitleInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded text-[11px] font-semibold flex items-center space-x-1 transition border border-white/10 cursor-pointer"
                >
                  <Subtitles className="w-3 h-3 text-cyan-400" />
                  <span>Add Subtitle</span>
                </button>
              </div>
            </div>

            {/* External Audio Prompt Modal/Bar */}
            {showAddAudioPrompt && (
              <div className="bg-neutral-900 border border-red-500/30 rounded-lg p-3 space-y-2 text-xs">
                <p className="text-neutral-300 font-semibold">
                  Select Language / Track Label for external audio:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={extraAudioLanguage}
                    onChange={(e) => setExtraAudioLanguage(e.target.value)}
                    placeholder="e.g. Hindi Dub, Spanish, Commentary"
                    className="bg-neutral-950 border border-white/20 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Audio File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAudioPrompt(false)}
                    className="px-2 py-1.5 text-neutral-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* List of Detected & External Tracks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detectedAudioTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="bg-neutral-900 border border-white/5 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-md bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {track.language}
                        </span>
                        {track.isOriginal && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-red-600/30 text-red-400 rounded font-extrabold uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center space-x-1.5 mt-0.5">
                        <span className="text-neutral-300 font-mono">{track.codec}</span>
                        <span>•</span>
                        <span>{track.channels}</span>
                      </div>
                    </div>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              ))}

              {/* Added external audio tracks */}
              {externalAudioTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="bg-neutral-900 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-md bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                      {detectedAudioTracks.length + idx + 1}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {track.language}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-cyan-600/30 text-cyan-400 rounded font-extrabold uppercase tracking-wider">
                          External
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center space-x-1.5 mt-0.5">
                        <span className="text-cyan-300 font-mono">{track.codec}</span>
                        <span>•</span>
                        <span>{track.channels}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeExternalAudioTrack(track.id)}
                    className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                    title="Remove track"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* External Subtitles */}
            {externalSubtitles.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  External Subtitle Tracks:
                </p>
                <div className="flex flex-wrap gap-2">
                  {externalSubtitles.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-neutral-900 border border-white/10 rounded-md px-2.5 py-1 text-xs text-neutral-300 flex items-center space-x-2"
                    >
                      <Subtitles className="w-3 h-3 text-cyan-400" />
                      <span>{sub.label}</span>
                      <button
                        type="button"
                        onClick={() => removeExternalSubtitle(sub.id)}
                        className="text-neutral-500 hover:text-red-400 cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
