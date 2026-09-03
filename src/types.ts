export type MediaType = 'movie' | 'series';

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis: string;
  thumbnail: string;
  videoUrl: string;
}

export interface AudioTrack {
  id: string;
  language: string;
  label: string;
  channels?: string;
  codec?: string;
  src?: string;
  videoUrl?: string;
  isDefault?: boolean;
  isOriginal?: boolean;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  src?: string;
  isDefault?: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  poster: string;
  banner: string;
  year: number;
  rating: number;
  duration?: string;
  seasonsCount?: number;
  genres: string[];
  description: string;
  director?: string;
  cast?: string[];
  videoUrl: string;
  audioTracks: AudioTrack[];
  subtitleTracks: SubtitleTrack[];
  episodes?: Episode[];
  badge?: string;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface PlayerSettings {
  playbackRate: PlaybackSpeed;
  volume: number; // 0 to 1
  isMuted: boolean;
  activeAudioTrackId: string;
  activeSubtitleTrackId: string | null; // null means subtitles hidden
  subtitlesEnabled: boolean;
}

export type ViewMode = 'home' | 'movies' | 'series' | 'private_screen';
