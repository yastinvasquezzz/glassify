import { create } from 'zustand';
import { Track, Playlist, Album, ViewType } from '../types';
import { MOCK_TRACKS } from '../data/mockData';
import {
  auth,
  logoutUser,
  listenToUserPlaylists,
  listenToUserData,
  syncLikedSongsToFirestore,
  syncRecentlyPlayedToFirestore,
  savePlaylistToFirestore,
  deletePlaylistFromFirestore,
} from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { searchTracksFromApi } from '../services/musicApi';
import { djEngine } from '../services/djEngine';

const LIKED_TRACKS_KEY = 'glassify_liked_tracks_v2';
const PLAYLISTS_STORAGE_KEY = 'glassify_user_playlists';
const RECENTLY_PLAYED_KEY = 'glassify_recently_played';

const isDummyTrack = (t: Track) => {
  const dummyTitles = ['neon skyline', 'midnight glass', 'prism & reflection', 'velvet echoes', 'aurora drift'];
  return dummyTitles.includes((t.title || '').toLowerCase());
};

const getInitialRecentlyPlayed = (): Track[] => {
  try {
    const saved = localStorage.getItem(RECENTLY_PLAYED_KEY);
    if (!saved) return [];
    const parsed: Track[] = JSON.parse(saved);
    const cleaned = parsed.filter((t) => !isDummyTrack(t));
    return cleaned.slice(0, 5);
  } catch (e) {
    return [];
  }
};

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  queueIndex: number;

  likedTracks: Track[];
  likedTrackIds: string[];
  recentlyPlayed: Track[];
  equalizerPreset: string;

  // Glass AI DJ State (OFF by default)
  isDJModeActive: boolean;
  isDJSpeaking: boolean;
  djSpeechText: string;
  songsPlayedInDJSession: number;

  authUser: FirebaseUser | null;
  isAuthModalOpen: boolean;

  activeView: ViewType;
  searchQuery: string;
  selectedCategory: string | null;
  selectedArtistId: string | null;
  selectedAlbumId: string | null;
  selectedAlbum: Album | null;
  selectedPlaylistId: string | null;

  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isEqualizerOpen: boolean;
  isNowPlayingExpanded: boolean;
  isMobileSidebarOpen: boolean;

  userPlaylists: Playlist[];

  setCurrentTrack: (track: Track) => void;
  playTrack: (track: Track, customQueue?: Track[]) => void;
  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;

  toggleLikeTrack: (trackId: string) => void;
  toggleLikeTrackObject: (track: Track) => void;

  toggleDJMode: () => Promise<void>;

  toggleAuthModal: () => void;
  logoutFirebase: () => Promise<void>;

  setActiveView: (view: ViewType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  selectArtist: (artistId: string) => void;
  selectAlbum: (albumId: string) => void;
  selectAlbumObject: (album: Album) => void;
  selectPlaylist: (playlistId: string) => void;

  toggleLyricsDrawer: () => void;
  toggleQueueDrawer: () => void;
  toggleEqualizerModal: () => void;
  toggleNowPlayingExpanded: () => void;
  toggleMobileSidebar: () => void;
  setEqualizerPreset: (preset: string) => void;

  createPlaylist: (title: string, description?: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const initialRecentlyPlayed = getInitialRecentlyPlayed();
  const fallbackTrack = initialRecentlyPlayed[0] || MOCK_TRACKS[0];

  // Listen to Firebase Auth state changes
  onAuthStateChanged(auth, (user) => {
    set({ authUser: user });
    if (user) {
      set({ isAuthModalOpen: false });

      // Listen to Cloud Firestore Playlists under users/{uid}/playlists
      listenToUserPlaylists(user.uid, (remotePlaylists) => {
        set({ userPlaylists: remotePlaylists });
      });

      // Listen to Cloud Firestore User Document Data under users/{uid}
      listenToUserData(user.uid, (data) => {
        if (data?.likedTracks && Array.isArray(data.likedTracks)) {
          const cleanedLiked = data.likedTracks.filter((t: Track) => !isDummyTrack(t));
          set({
            likedTracks: cleanedLiked,
            likedTrackIds: cleanedLiked.map((t) => t.id),
          });
        }
        if (data?.recentlyPlayed && Array.isArray(data.recentlyPlayed)) {
          const cleaned = data.recentlyPlayed.filter((t: Track) => !isDummyTrack(t));
          set({ recentlyPlayed: cleaned.slice(0, 5) });
        }
      });
    } else {
      // CLEAR ALL USER DATA ON LOGOUT
      set({
        likedTracks: [],
        likedTrackIds: [],
        userPlaylists: [],
      });
    }
  });

  return {
    currentTrack: fallbackTrack,
    isPlaying: false,
    currentTime: 0,
    duration: fallbackTrack.duration,
    volume: 0.8,
    isMuted: false,
    isShuffle: false,
    repeatMode: 'off',
    queue: MOCK_TRACKS,
    queueIndex: 0,

    likedTracks: [],
    likedTrackIds: [],
    recentlyPlayed: initialRecentlyPlayed,
    equalizerPreset: 'Flat',

    isDJModeActive: false,
    isDJSpeaking: false,
    djSpeechText: '',
    songsPlayedInDJSession: 0,

    authUser: null,
    isAuthModalOpen: false,

    activeView: 'home',
    searchQuery: '',
    selectedCategory: null,
    selectedArtistId: null,
    selectedAlbumId: null,
    selectedAlbum: null,
    selectedPlaylistId: null,

    isLyricsOpen: false,
    isQueueOpen: false,
    isEqualizerOpen: false,
    isNowPlayingExpanded: false,
    isMobileSidebarOpen: false,

    userPlaylists: [],

    setCurrentTrack: (track) => set({ currentTrack: track, currentTime: 0 }),

    playTrack: (track, customQueue) => {
      const { queue, recentlyPlayed, authUser, isDJModeActive, songsPlayedInDJSession, volume } = get();
      const newQueue = customQueue && customQueue.length > 0 ? customQueue : queue;
      const index = newQueue.findIndex((t) => t.id === track.id);
      const newPlayedCount = songsPlayedInDJSession + 1;

      const updatedRecently = [track, ...recentlyPlayed.filter((t) => t.id !== track.id && !isDummyTrack(t))].slice(0, 5);

      try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updatedRecently));
      } catch (e) {}

      if (authUser) {
        syncRecentlyPlayedToFirestore(authUser.uid, updatedRecently);
      }

      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        queue: newQueue.length > 0 ? newQueue : [track],
        queueIndex: index !== -1 ? index : 0,
        recentlyPlayed: updatedRecently,
        songsPlayedInDJSession: newPlayedCount,
      });

      if (isDJModeActive && newPlayedCount > 1 && newPlayedCount % 4 === 0) {
        const script = djEngine.generateScript('transition', {
          trackTitle: track.title,
          artistName: track.artist,
          genre: track.genre,
          songsPlayedCount: newPlayedCount,
        });

        set({ djSpeechText: script });

        const originalVolume = volume;
        djEngine.speak(
          script,
          () => {
            set({ isDJSpeaking: true });
            get().setVolume(0.2);
          },
          () => {
            set({ isDJSpeaking: false, djSpeechText: '' });
            get().setVolume(originalVolume);
          }
        );
      }
    },

    togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    nextTrack: async () => {
      const { queue, queueIndex, isShuffle, repeatMode, currentTrack } = get();
      if (!currentTrack) return;

      if (repeatMode === 'one') {
        set({ currentTime: 0, isPlaying: true });
        return;
      }

      let nextIndex: number;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
        const nextTrackItem = queue[nextIndex];
        if (nextTrackItem && !isDummyTrack(nextTrackItem)) {
          get().playTrack(nextTrackItem, queue);
          return;
        }
      } else {
        nextIndex = queueIndex + 1;
      }

      if (nextIndex < queue.length) {
        const nextTrackItem = queue[nextIndex];
        if (nextTrackItem && !isDummyTrack(nextTrackItem)) {
          get().playTrack(nextTrackItem, queue);
          return;
        }
      }

      try {
        const queryTerm = `${currentTrack.artist} ${currentTrack.genre || 'hits'}`;
        const results = await searchTracksFromApi(queryTerm);

        const realCandidates = results.tracks.filter(
          (t) => t.id !== currentTrack.id && !isDummyTrack(t) && !queue.some((q) => q.id === t.id)
        );

        const recommendedTrack = realCandidates[0] || results.tracks.find((t) => t.id !== currentTrack.id);

        if (recommendedTrack) {
          const updatedQueue = [...queue.filter((t) => !isDummyTrack(t)), recommendedTrack];
          get().playTrack(recommendedTrack, updatedQueue);
          return;
        }
      } catch (err) {
        console.warn('Smart recommendation fetch notice:', err);
      }

      if (repeatMode === 'all' && queue.length > 0) {
        const firstValid = queue.find((t) => !isDummyTrack(t)) || queue[0];
        get().playTrack(firstValid, queue);
      } else {
        set({ isPlaying: false });
      }
    },

    previousTrack: () => {
      const { queue, queueIndex, currentTime } = get();
      if (currentTime > 3) {
        set({ currentTime: 0 });
        return;
      }

      const prevIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
      const prevTrack = queue[prevIndex];
      if (prevTrack && !isDummyTrack(prevTrack)) {
        get().playTrack(prevTrack, queue);
      }
    },

    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

    cycleRepeatMode: () => set((state) => {
      const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      return { repeatMode: modes[(currentIndex + 1) % modes.length] };
    }),

    toggleLikeTrack: (trackId) => {
      const { currentTrack, queue, likedTracks } = get();
      let targetTrack = likedTracks.find((t) => t.id === trackId) || (currentTrack?.id === trackId ? currentTrack : null) || queue.find((t) => t.id === trackId);
      if (targetTrack) {
        get().toggleLikeTrackObject(targetTrack);
      }
    },

    toggleLikeTrackObject: (track) => set((state) => {
      const exists = state.likedTrackIds.includes(track.id);
      let updatedLikedTracks: Track[];

      if (exists) {
        updatedLikedTracks = state.likedTracks.filter((t) => t.id !== track.id);
      } else {
        updatedLikedTracks = [track, ...state.likedTracks];
      }

      const updatedLikedIds = updatedLikedTracks.map((t) => t.id);

      try {
        localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(updatedLikedTracks));
      } catch (e) {}

      // SYNC FULL LIKED SONGS ARRAY TO CLOUD FIRESTORE FOR THIS USER
      if (state.authUser) {
        syncLikedSongsToFirestore(state.authUser.uid, updatedLikedTracks);
      }

      return {
        likedTracks: updatedLikedTracks,
        likedTrackIds: updatedLikedIds,
      };
    }),

    toggleDJMode: async () => {
      const { isDJModeActive, currentTrack, volume, authUser } = get();
      const nextState = !isDJModeActive;

      if (!nextState) {
        djEngine.stop();
        set({ isDJModeActive: false, isDJSpeaking: false, djSpeechText: '' });
        return;
      }

      set({ isDJModeActive: true });

      if (currentTrack) {
        const userName = authUser?.displayName?.split(' ')[0] || '';
        const greeting = userName ? `¡Hola ${userName}!` : '¡Hola!';
        const script = `${greeting} Soy tu DJ Glassify. He analizado la vibra de ${currentTrack.artist} y he preparado una sesión especial de 4 canciones para ti. ¡Siente el ritmo!`;

        set({ djSpeechText: script });

        const originalVolume = volume;
        djEngine.speak(
          script,
          () => {
            set({ isDJSpeaking: true });
            get().setVolume(0.2);
          },
          () => {
            set({ isDJSpeaking: false, djSpeechText: '' });
            get().setVolume(originalVolume);
          }
        );

        try {
          const results = await searchTracksFromApi(`${currentTrack.artist} official audio`);
          if (results.tracks.length > 0) {
            const djSessionQueue = [currentTrack, ...results.tracks.slice(0, 4)];
            set({ queue: djSessionQueue, queueIndex: 0, songsPlayedInDJSession: 1 });
          }
        } catch (e) {}
      }
    },

    toggleAuthModal: () => set((state) => ({ isAuthModalOpen: !state.isAuthModalOpen })),

    logoutFirebase: async () => {
      await logoutUser();
      set({
        authUser: null,
        likedTracks: [],
        likedTrackIds: [],
        userPlaylists: [],
      });
    },

    setActiveView: (view) => set({ activeView: view, isMobileSidebarOpen: false }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedCategory: (category) => set({ selectedCategory: category, searchQuery: category || '', activeView: 'search' }),

    selectArtist: (artistId) => set({ selectedArtistId: artistId, activeView: 'artist', isMobileSidebarOpen: false }),
    selectAlbum: (albumId) => set({ selectedAlbumId: albumId, activeView: 'album', isMobileSidebarOpen: false }),
    selectAlbumObject: (album) => set({ selectedAlbum: album, selectedAlbumId: album.id, activeView: 'album', isMobileSidebarOpen: false }),
    selectPlaylist: (playlistId) => set({ selectedPlaylistId: playlistId, activeView: 'playlist', isMobileSidebarOpen: false }),

    toggleLyricsDrawer: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen, isQueueOpen: false })),
    toggleQueueDrawer: () => set((state) => ({ isQueueOpen: !state.isQueueOpen, isLyricsOpen: false })),
    toggleEqualizerModal: () => set((state) => ({ isEqualizerOpen: !state.isEqualizerOpen })),
    toggleNowPlayingExpanded: () => set((state) => ({ isNowPlayingExpanded: !state.isNowPlayingExpanded })),
    toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
    setEqualizerPreset: (preset) => set({ equalizerPreset: preset }),

    // CREATE PLAYLIST AND SAVE TO CLOUD FIRESTORE USER ACCOUNT
    createPlaylist: (title, description = '') => set((state) => {
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}`,
        title,
        description,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        tracks: [],
        isPublic: true,
        owner: state.authUser?.displayName || 'Usuario Glassify',
        likesCount: 0,
      };
      const updated = [...state.userPlaylists, newPlaylist];
      try {
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}

      // SAVE TO CLOUD FIRESTORE USER ACCOUNT
      if (state.authUser) {
        savePlaylistToFirestore(state.authUser.uid, newPlaylist);
      }

      return { userPlaylists: updated };
    }),

    // DELETE PLAYLIST FROM CLOUD FIRESTORE USER ACCOUNT
    deletePlaylist: (playlistId) => set((state) => {
      const updated = state.userPlaylists.filter((pl) => pl.id !== playlistId);
      try {
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}

      // DELETE FROM CLOUD FIRESTORE USER ACCOUNT
      if (state.authUser) {
        deletePlaylistFromFirestore(state.authUser.uid, playlistId);
      }

      const isCurrentActive = state.selectedPlaylistId === playlistId;
      return {
        userPlaylists: updated,
        activeView: isCurrentActive ? 'library' : state.activeView,
      };
    }),

    // ADD TRACK TO PLAYLIST AND SAVE TO CLOUD FIRESTORE USER ACCOUNT
    addTrackToPlaylist: (playlistId, track) => set((state) => {
      let updatedPlaylistToSave: Playlist | null = null;
      const updatedPlaylists = state.userPlaylists.map((pl) => {
        if (pl.id === playlistId && !pl.tracks.some((t) => t.id === track.id)) {
          const modified = { ...pl, tracks: [...pl.tracks, track] };
          updatedPlaylistToSave = modified;
          return modified;
        }
        return pl;
      });

      try {
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists));
      } catch (e) {}

      // SAVE MODIFIED PLAYLIST TO CLOUD FIRESTORE USER ACCOUNT
      if (state.authUser && updatedPlaylistToSave) {
        savePlaylistToFirestore(state.authUser.uid, updatedPlaylistToSave);
      }

      return { userPlaylists: updatedPlaylists };
    }),
  };
});
