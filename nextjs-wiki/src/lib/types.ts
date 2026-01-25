export interface MediaTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  type: 'audio' | 'video';
  thumbnail?: string;
  duration?: number;
}

export interface PlayerState {
  currentTrack: MediaTrack | null;
  playlist: MediaTrack[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isVisible: boolean;
  isMini: boolean;
  repeatMode: 'none' | 'all' | 'one';
  isShuffled: boolean;
}

export interface QueueAction {
  type: 'replace' | 'play-next' | 'add-to-end';
  track: MediaTrack;
}
