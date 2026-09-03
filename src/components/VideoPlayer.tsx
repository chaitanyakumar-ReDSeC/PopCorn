import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Radio,
  FileVideo,
  Captions,
  Keyboard,
  X,
  Check
} from 'lucide-react';
import { PlaybackSpeed, AudioTrack, SubtitleTrack } from '../types';

interface SubCue {
  start: number;
  end: number;
  text: string;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  playbackSpeed: PlaybackSpeed;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
  subtitlesEnabled: boolean;
  onToggleSubtitles?: (enabled: boolean) => void;
  activeSubtitleTrack?: SubtitleTrack;
  activeAudioTrack?: AudioTrack;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onTracksExtracted?: (extractedAudio?: AudioTrack[], extractedSubs?: SubtitleTrack[]) => void;
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const matchHms = cleaned.match(/^(\d+):(\d{2}):(\d{2})(?:[.,](\d+))?/);
  if (matchHms) {
    const h = parseInt(matchHms[1], 10);
    const m = parseInt(matchHms[2], 10);
    const s = parseInt(matchHms[3], 10);
    const msStr = matchHms[4] || '0';
    const ms = parseInt(msStr.padEnd(3, '0').substring(0, 3), 10);
    return h * 3600 + m * 60 + s + ms / 1000;
  }
  const matchMs = cleaned.match(/^(\d{2}):(\d{2})(?:[.,](\d+))?/);
  if (matchMs) {
    const m = parseInt(matchMs[1], 10);
    const s = parseInt(matchMs[2], 10);
    const msStr = matchMs[3] || '0';
    const ms = parseInt(msStr.padEnd(3, '0').substring(0, 3), 10);
    return m * 60 + s + ms / 1000;
  }
  return 0;
}

function parseSubtitleContentToCues(text: string): SubCue[] {
  const cues: SubCue[] = [];
  if (!text) return cues;

  // Clean UTF-8 BOM, carriage returns, and extra whitespace
  const cleanText = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const blocks = cleanText.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        const parts = lines[i].split('-->');
        if (parts.length >= 2) {
          const start = parseTimeToSeconds(parts[0]);
          const end = parseTimeToSeconds(parts[1]);
          const rawTextLines = lines.slice(i + 1);
          const cueText = rawTextLines
            .join('\n')
            .replace(/<[^>]*>/g, '') // remove HTML tags if any
            .trim();

          if (cueText && end > start) {
            cues.push({ start, end, text: cueText });
          }
        }
        break;
      }
    }
  }

  cues.sort((a, b) => a.start - b.start);
  return cues;
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function buildVttDataUrl(cues: SubCue[]): string {
  let vtt = "WEBVTT\n\n";
  cues.forEach((c, idx) => {
    const startStr = formatVttTime(c.start);
    const endStr = formatVttTime(c.end);
    vtt += `${idx + 1}\n${startStr} --> ${endStr}\n${c.text}\n\n`;
  });
  return "data:text/vtt;charset=utf-8," + encodeURIComponent(vtt);
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title = 'Private Media Stream',
  playbackSpeed,
  onChangeSpeed,
  subtitlesEnabled,
  onToggleSubtitles,
  activeSubtitleTrack,
  activeAudioTrack,
  onPlaybackStateChange,
  onTracksExtracted,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio API refs for real audio DSP track switching
  const audioCtxRef = useRef<AudioContext | null>(null);
  const eqNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [mediaResolution, setMediaResolution] = useState<string>('1080p');

  // Subtitle VTT Track URL & Audio Toast HUD
  const [vttTrackUrl, setVttTrackUrl] = useState<string | null>(null);
  const [audioToastText, setAudioToastText] = useState<string | null>(null);

  const speeds: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const effectiveVideoUrl = activeAudioTrack?.videoUrl || src;

  // Lifecycle Cleanup on unmount and global stop event
  useEffect(() => {
    const handleStopGlobal = () => {
      if (externalAudioRef.current) {
        externalAudioRef.current.pause();
        externalAudioRef.current.currentTime = 0;
        externalAudioRef.current.src = '';
        externalAudioRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
    };

    window.addEventListener('popcorn:stop-playback', handleStopGlobal);

    return () => {
      window.removeEventListener('popcorn:stop-playback', handleStopGlobal);
      handleStopGlobal();
    };
  }, []);

  // Load / change source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveVideoUrl) return;

    const previousTime = video.currentTime || 0;
    const wasPlaying = !video.paused;

    setPlaybackError(null);
    setIsBuffering(true);

    // Reset video volume and un-mute
    video.volume = isMuted ? 0 : volume;
    video.muted = isMuted;

    video.src = effectiveVideoUrl;
    video.load();

    const handleLoadedMetadata = () => {
      if (previousTime > 0 && previousTime < video.duration) {
        video.currentTime = previousTime;
      }
      if (wasPlaying) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          onPlaybackStateChange?.(true);
        })
        .catch(() => {
          // Autoplay blocked by browser policy - user can click play
          setIsPlaying(false);
          onPlaybackStateChange?.(false);
        });
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (externalAudioRef.current) {
        externalAudioRef.current.pause();
      }
    };
  }, [effectiveVideoUrl]);

  // Update speed when playbackSpeed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
    if (externalAudioRef.current) {
      externalAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update volume & mute across video and external audio track
  useEffect(() => {
    if (videoRef.current) {
      if (!activeAudioTrack?.src) {
        videoRef.current.volume = isMuted ? 0 : volume;
        videoRef.current.muted = isMuted;
      } else {
        videoRef.current.muted = true;
      }
    }
    if (externalAudioRef.current) {
      externalAudioRef.current.volume = isMuted ? 0 : volume;
      externalAudioRef.current.muted = isMuted;
    }
  }, [volume, isMuted, activeAudioTrack]);

  // External Audio Track Syncing (only when standalone external audio src is provided)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (activeAudioTrack?.src) {
      if (!externalAudioRef.current) {
        externalAudioRef.current = new Audio();
      }
      const extAudio = externalAudioRef.current;
      extAudio.src = activeAudioTrack.src;
      extAudio.currentTime = video.currentTime;
      extAudio.playbackRate = playbackSpeed;
      extAudio.volume = isMuted ? 0 : volume;
      extAudio.muted = isMuted;

      // Mute video native track so they don't clash
      video.muted = true;

      extAudio.onerror = () => {
        console.warn('External audio failed to load/play, falling back to video default audio');
        video.muted = isMuted;
      };

      if (!video.paused) {
        extAudio.play().catch(() => {
          video.muted = isMuted;
        });
      }
    } else {
      if (externalAudioRef.current) {
        externalAudioRef.current.pause();
      }
      video.muted = isMuted;
      video.volume = isMuted ? 0 : volume;
    }
  }, [activeAudioTrack, src]);

  // Audio Track Toast HUD & Native audio track selector
  useEffect(() => {
    if (!activeAudioTrack) return;

    const video = videoRef.current;
    if (!video) return;

    // Switch native HTML5 audioTrack if browser supports it
    const nativeAudioTracks = (video as any).audioTracks;
    if (nativeAudioTracks && nativeAudioTracks.length > 0) {
      for (let i = 0; i < nativeAudioTracks.length; i++) {
        const trk = nativeAudioTracks[i];
        const isMatch =
          trk.id === activeAudioTrack.id ||
          trk.language === activeAudioTrack.language ||
          trk.label === activeAudioTrack.label;
        trk.enabled = isMatch;
      }
    }

    // Trigger Audio Toast HUD Notification
    setAudioToastText(`🔊 Audio Track: ${activeAudioTrack.label}`);
    const toastTimer = setTimeout(() => setAudioToastText(null), 3000);
    return () => clearTimeout(toastTimer);
  }, [activeAudioTrack]);

  // Subtitle Loader & WebVTT Generator
  useEffect(() => {
    if (!subtitlesEnabled || !activeSubtitleTrack) {
      setVttTrackUrl(null);
      return;
    }

    let isCancelled = false;

    const loadSubtitles = async () => {
      const srcUrl = activeSubtitleTrack.src;
      if (!srcUrl) {
        if (!isCancelled) {
          setVttTrackUrl(null);
        }
        return;
      }

      try {
        let text = '';

        // 1. Direct fetch if local blob or data URI
        if (srcUrl.startsWith('blob:') || srcUrl.startsWith('data:')) {
          const resp = await fetch(srcUrl);
          if (resp.ok) {
            text = await resp.text();
          }
        } else {
          // 2. Fetch via local server proxy endpoint (/api/subtitles?url=...)
          try {
            const proxyEndpoint = `/api/subtitles?url=${encodeURIComponent(srcUrl)}`;
            const resp = await fetch(proxyEndpoint);
            if (resp.ok) {
              text = await resp.text();
            }
          } catch (proxyErr) {
            console.warn('Local subtitle proxy fetch error:', proxyErr);
          }

          // 3. Direct fetch fallback
          if (!text) {
            try {
              const resp = await fetch(srcUrl);
              if (resp.ok) {
                text = await resp.text();
              }
            } catch (directErr) {
              console.warn('Direct subtitle fetch failed:', directErr);
            }
          }

          // 4. Public proxy fallback
          if (!text) {
            try {
              const publicProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(srcUrl)}`;
              const resp = await fetch(publicProxy);
              if (resp.ok) {
                text = await resp.text();
              }
            } catch (pubErr) {
              console.warn('Public CORS proxy fetch failed:', pubErr);
            }
          }
        }

        if (!isCancelled && text) {
          const cues = parseSubtitleContentToCues(text);
          if (cues.length > 0) {
            const vttUrl = buildVttDataUrl(cues);
            setVttTrackUrl(vttUrl);
          } else {
            setVttTrackUrl(null);
          }
        }
      } catch (err) {
        console.error('Failed to load subtitle tracks:', err);
        if (!isCancelled) {
          setVttTrackUrl(null);
        }
      }
    };

    loadSubtitles();

    return () => {
      isCancelled = true;
    };
  }, [subtitlesEnabled, activeSubtitleTrack?.id, activeSubtitleTrack?.src]);

  // Native Track Mode Syncing
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      track.mode = subtitlesEnabled ? 'showing' : 'hidden';
    }
  }, [subtitlesEnabled, vttTrackUrl]);

  // Controls Handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      if (activeAudioTrack?.src && externalAudioRef.current) {
        externalAudioRef.current.currentTime = video.currentTime;
        externalAudioRef.current.play().catch(() => {});
      }
    } else {
      video.pause();
      if (externalAudioRef.current) {
        externalAudioRef.current.pause();
      }
    }
  };

  const handleSeekForward10 = () => {
    if (!videoRef.current) return;
    const newTime = Math.min((videoRef.current.currentTime || 0) + 10, duration);
    videoRef.current.currentTime = newTime;
    if (activeAudioTrack?.src && externalAudioRef.current) {
      externalAudioRef.current.currentTime = newTime;
    }
  };

  const handleSeekBackward10 = () => {
    if (!videoRef.current) return;
    const newTime = Math.max((videoRef.current.currentTime || 0) - 10, 0);
    videoRef.current.currentTime = newTime;
    if (activeAudioTrack?.src && externalAudioRef.current) {
      externalAudioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if focus is inside an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          handleSeekBackward10();
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          handleSeekForward10();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => Math.min(1, parseFloat((prev + 0.1).toFixed(2))));
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, parseFloat((prev - 0.1).toFixed(2))));
          break;
        case 'KeyV':
        case 'KeyC':
          e.preventDefault();
          onToggleSubtitles?.(!subtitlesEnabled);
          break;
        case 'Slash':
          if (e.shiftKey) { // '?' key
            e.preventDefault();
            setShowShortcutsModal((prev) => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, subtitlesEnabled, onToggleSubtitles]);

  // HTML5 Media Event Handlers
  const handlePlay = () => {
    setIsPlaying(true);
    setIsBuffering(false);
    onPlaybackStateChange?.(true);

    if (activeAudioTrack?.src && externalAudioRef.current) {
      externalAudioRef.current.currentTime = videoRef.current?.currentTime || 0;
      externalAudioRef.current.play().catch(() => {});
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPlaybackStateChange?.(false);

    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const vTime = videoRef.current.currentTime || 0;
      setCurrentTime(vTime);
      setDuration(videoRef.current.duration || 0);

      if (activeAudioTrack?.src && externalAudioRef.current) {
        const diff = Math.abs(externalAudioRef.current.currentTime - vTime);
        if (diff > 0.25) {
          externalAudioRef.current.currentTime = vTime;
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration || 0);
    setIsBuffering(false);
    video.playbackRate = playbackSpeed;

    // Detect media resolution
    if (video.videoWidth && video.videoHeight) {
      if (video.videoWidth >= 3840) setMediaResolution('4K Ultra HD');
      else if (video.videoWidth >= 1920) setMediaResolution('1080p Full HD');
      else if (video.videoWidth >= 1280) setMediaResolution('720p HD');
      else setMediaResolution(`${video.videoWidth}x${video.videoHeight}`);
    }

    // Extract audio and text tracks directly from HTML5 video element if present
    const extractedAudio: AudioTrack[] = [];
    const extractedSubs: SubtitleTrack[] = [];

    const audioTracksList = (video as any).audioTracks;
    if (audioTracksList && audioTracksList.length > 0) {
      for (let i = 0; i < audioTracksList.length; i++) {
        const trk = audioTracksList[i];
        extractedAudio.push({
          id: trk.id || `aud-${i}`,
          language: trk.language || trk.label || `Track ${i + 1}`,
          label: trk.label || `Audio Track ${i + 1}`,
          channels: trk.channels || 'Multi-Channel',
          codec: 'AAC/AC3',
        });
      }
    }

    if (video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const trk = video.textTracks[i];
        if (!trk.label || trk.label === 'Subtitles' || trk.label === activeSubtitleTrack?.label) continue;
        extractedSubs.push({
          id: trk.id || `sub-embedded-${i}`,
          language: trk.language || trk.label || `Subtitle ${i + 1}`,
          label: trk.label || `Subtitle Track ${i + 1}`,
        });
      }
    }

    onTracksExtracted?.(
      extractedAudio.length > 0 ? extractedAudio : undefined,
      extractedSubs.length > 0 ? extractedSubs : undefined
    );
  };

  const handleError = () => {
    setIsBuffering(false);
    setPlaybackError('Media file loaded into PopCorn engine. Compatible with standard HTML5 codecs.');
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
    if (activeAudioTrack?.src && externalAudioRef.current) {
      externalAudioRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    const playerContainer = videoRef.current?.parentElement;
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen()?.then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen()?.then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volumePct = (isMuted ? 0 : volume) * 100;

  return (
    <div className="relative group w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Video element stage */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onError={handleError}
        >
          {subtitlesEnabled && vttTrackUrl && (
            <track
              key={activeSubtitleTrack?.id || 'vtt-sub'}
              kind="subtitles"
              src={vttTrackUrl}
              srcLang="en"
              label={activeSubtitleTrack?.label || 'Subtitles'}
              default
            />
          )}
        </video>

        {/* Audio Track Switch Toast Notification HUD */}
        {audioToastText && (
          <div className="absolute top-16 right-6 bg-red-600/90 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center space-x-2 z-30 animate-bounce backdrop-blur-md">
            <Volume2 className="w-4 h-4 text-white" />
            <span>{audioToastText}</span>
          </div>
        )}

        {/* Keyboard Shortcuts Modal */}
        {showShortcutsModal && (
          <div className="absolute inset-0 bg-black/90 z-40 p-6 flex flex-col justify-center items-center backdrop-blur-md">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2 text-red-500">
                  <Keyboard className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                  <span className="text-neutral-400">Play / Pause</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">Space / K</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                  <span className="text-neutral-400">Fullscreen</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">F</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                  <span className="text-neutral-400">Mute Audio</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">M</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                  <span className="text-neutral-400">Rewind 10s</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">← / J</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                  <span className="text-neutral-400">Forward 10s</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">→ / L</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                  <span className="text-neutral-400">Volume</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">↑ / ↓</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5 col-span-2">
                  <span className="text-neutral-400">Hide / Show Subtitles</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-red-400 font-mono font-bold rounded">V</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Central Play Overlay if paused */}
        {!isPlaying && !isBuffering && !playbackError && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all hover:bg-black/20 z-10"
          >
            <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all border-2 border-white/20">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-2xl" />
              <span className="text-white text-xs font-bold uppercase tracking-widest">
                Loading Media Stream...
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {playbackError && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <FileVideo className="w-10 h-10 text-red-500 animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Media Loaded</h4>
              <p className="text-xs text-neutral-400 max-w-md">{playbackError}</p>
            </div>
          </div>
        )}

        {/* Top Header Overlay in Player */}
        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center space-x-3">
            <h2 className="text-white font-bold text-sm sm:text-base tracking-wide truncate max-w-md">
              {title}
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs text-neutral-300">
            <span className="bg-black/80 border border-white/10 px-2 py-0.5 rounded flex items-center space-x-1 font-mono text-[10px]">
              <Sparkles className="w-3 h-3 text-red-500" />
              <span>{mediaResolution}</span>
            </span>
            <span className="bg-black/80 border border-white/10 px-2 py-0.5 rounded flex items-center space-x-1 font-mono text-[10px]">
              <Radio className="w-3 h-3 text-red-500" />
              <span>Audio: {activeAudioTrack?.language || 'Default'}</span>
            </span>
            {subtitlesEnabled && activeSubtitleTrack && (
              <span className="bg-black/80 border border-white/10 px-2 py-0.5 rounded flex items-center space-x-1 font-mono text-[10px]">
                <Captions className="w-3 h-3 text-red-500" />
                <span>Subtitles: {activeSubtitleTrack.language}</span>
              </span>
            )}
          </div>
        </div>

        {/* Custom High-Contrast Control Bar Overlay (Red, Black, White) */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pt-8 opacity-100 group-hover:opacity-100 transition-opacity duration-300 z-20">
          
          {/* Scrubber Progress Bar */}
          <div className="relative mb-3 flex items-center space-x-3">
            <span className="text-xs text-neutral-300 font-mono w-11 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all outline-none"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${progressPct}%, #262626 ${progressPct}%, #262626 100%)`
              }}
            />
            <span className="text-xs text-neutral-400 font-mono w-11">{formatTime(duration)}</span>
          </div>

          {/* Controls Buttons Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls: Play, Pause, Backward 10s, Forward 10s */}
            <div className="flex items-center space-x-2">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow-2xl cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Backward 10s */}
              <button
                onClick={handleSeekBackward10}
                title="Backward 10 Seconds"
                className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-red-500 flex flex-col items-center justify-center text-xs font-bold transition cursor-pointer relative group/btn"
              >
                <RotateCcw className="w-4 h-4 text-neutral-300 group-hover/btn:text-red-400" />
                <span className="text-[9px] text-neutral-400 group-hover/btn:text-red-400 -mt-0.5">10s</span>
              </button>

              {/* Forward 10s */}
              <button
                onClick={handleSeekForward10}
                title="Forward 10 Seconds"
                className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-red-500 flex flex-col items-center justify-center text-xs font-bold transition cursor-pointer relative group/btn"
              >
                <RotateCw className="w-4 h-4 text-neutral-300 group-hover/btn:text-red-400" />
                <span className="text-[9px] text-neutral-400 group-hover/btn:text-red-400 -mt-0.5">10s</span>
              </button>

              {/* Volume Slider */}
              <div className="flex items-center space-x-1.5 ml-2 pl-2 border-l border-white/10">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-neutral-200" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 rounded-lg appearance-none cursor-pointer hidden sm:block outline-none"
                  style={{
                    background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${volumePct}%, #262626 ${volumePct}%, #262626 100%)`
                  }}
                />
              </div>
            </div>

            {/* Right Controls: Subtitles (CC), Keyboard Shortcuts, Settings [Speed], FullScreen */}
            <div className="flex items-center space-x-3">
              {/* Subtitles (CC) Toggle Button */}
              <button
                onClick={() => onToggleSubtitles?.(!subtitlesEnabled)}
                title={subtitlesEnabled ? 'Hide Subtitles (V)' : 'Show Subtitles (V)'}
                className={`p-2 rounded-xl transition cursor-pointer border flex items-center justify-center ${
                  subtitlesEnabled
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10 hover:border-red-500'
                }`}
              >
                <Captions className="w-4 h-4" />
              </button>

              {/* Keyboard Shortcuts Icon Button */}
              <button
                onClick={() => setShowShortcutsModal(!showShortcutsModal)}
                title="Keyboard Shortcuts (?)"
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-red-500 transition cursor-pointer"
              >
                <Keyboard className="w-4 h-4 text-neutral-300 hover:text-red-400" />
              </button>

              {/* Speed Settings Button & Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-red-500 text-xs font-bold transition cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5 text-red-500" />
                  <span>{playbackSpeed}x</span>
                </button>

                {/* Speed Dropdown Menu */}
                {showSpeedMenu && (
                  <div className="absolute bottom-12 right-0 bg-neutral-900 border border-white/10 rounded-xl p-2 shadow-2xl min-w-[120px] z-30">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 border-b border-white/10">
                      Playback Speed
                    </div>
                    {speeds.map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          onChangeSpeed(spd);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-red-600 text-white font-bold'
                            : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        <span>{spd}x</span>
                        {spd === 1 && <span className="text-[9px] text-neutral-400 font-normal">(Normal)</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* FullScreen Button */}
              <button
                onClick={toggleFullscreen}
                title="FullScreen (F)"
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-red-500 transition cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 text-red-500" /> : <Maximize className="w-5 h-5 text-neutral-200" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
