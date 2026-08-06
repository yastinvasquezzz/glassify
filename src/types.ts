export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // seconds
  genre: string;
  dominantColor: string; // e.g. "hsl(280, 80%, 40%)"
  lyrics?: LyricLine[];
  explicit?: boolean;
  playCount?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  isPublic?: boolean;
  owner?: string;
  likesCount?: number;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  verified: boolean;
  followers: number;
  bio: string;
  topTracks: Track[];
  albums: Album[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  year: number;
  tracks: Track[];
}

export type ViewType = 
  | 'home' 
  | 'search' 
  | 'library' 
  | 'artist' 
  | 'album' 
  | 'playlist' 
  | 'lyrics' 
  | 'liked';

export interface FriendActivity {
  id: string;
  user: string;
  avatarUrl: string;
  track: Track;
  timestamp: string;
  isOnline: boolean;
}
