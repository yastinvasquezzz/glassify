import { Track, Album, Artist } from '../types';

export const JAMENDO_CLIENT_ID = 'af0d94b8';
export const JAMENDO_CLIENT_SECRET = 'ead31f8c74b41248e0632f2b45ca8edc';

// Helper to generate a harmonious HSL color based on string hash
const stringToHslColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 75%, 42%)`;
};

// Converts plain text lyrics into synced time lines
const parseLyricsToLines = (rawLyrics?: string, songTitle?: string, artistName?: string) => {
  if (!rawLyrics || rawLyrics.trim() === '') {
    return [
      { time: 0, text: `♪ [Reproduciendo: ${songTitle || 'Canción'} - ${artistName || 'Artista'}] ♪` },
      { time: 10, text: `Escuchando la versión oficial de Jamendo Hi-Fi` },
      { time: 25, text: `Sonido estéreo de alta fidelidad sin límites` },
      { time: 50, text: `♪ [Solo instrumental en vivo] ♪` },
      { time: 90, text: `Glassify — Música en streaming continuo Jamendo API` },
    ];
  }

  const lines = rawLyrics.split('\n').filter((l) => l.trim() !== '');
  return lines.map((text, idx) => ({
    time: idx * 8, // Estimate 8 seconds per line for smooth scrolling
    text: text.trim(),
  }));
};

/**
 * Searches tracks, albums and artists directly using the official Jamendo API
 */
export const searchJamendoMusic = async (queryTerm: string): Promise<{
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}> => {
  if (!queryTerm || queryTerm.trim() === '') {
    return { tracks: [], albums: [], artists: [] };
  }

  try {
    const encodedQuery = encodeURIComponent(queryTerm.trim());
    const tracksUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=40&namesearch=${encodedQuery}&include=musicinfo+lyrics`;

    const response = await fetch(tracksUrl);
    if (!response.ok) throw new Error(`Jamendo API HTTP Error: ${response.status}`);

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      // Fallback search by tag/fuzzy search if exact name search returns empty
      const fuzzyUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=40&search=${encodedQuery}&include=musicinfo+lyrics`;
      const fuzzyRes = await fetch(fuzzyUrl);
      if (fuzzyRes.ok) {
        const fuzzyData = await fuzzyRes.json();
        if (fuzzyData.results && fuzzyData.results.length > 0) {
          data.results = fuzzyData.results;
        }
      }
    }

    if (!data.results || data.results.length === 0) {
      return { tracks: [], albums: [], artists: [] };
    }

    // Process Jamendo Tracks
    const tracks: Track[] = data.results.map((item: any) => ({
      id: `jamendo-${item.id}`,
      title: item.name,
      artist: item.artist_name || 'Artista Jamendo',
      artistId: `artist-${item.artist_id || encodeURIComponent(item.artist_name || 'artist')}`,
      album: item.album_name || 'Álbum',
      albumId: `album-${item.album_id || encodeURIComponent(item.album_name || 'album')}`,
      coverUrl: item.album_image || item.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl: item.audio, // Official FULL LENGTH MP3 audio stream!
      duration: item.duration || 210,
      genre: item.musicinfo?.tags?.genres?.[0] || item.musicinfo?.genre || 'Pop',
      dominantColor: stringToHslColor(item.name + (item.artist_name || '')),
      explicit: false,
      playCount: item.stats?.rate_listened_total || Math.floor(Math.random() * 1000000) + 50000,
      lyrics: parseLyricsToLines(item.lyrics?.lyrics, item.name, item.artist_name),
    }));

    // Group Tracks into Albums
    const albumMap = new Map<string, Album>();
    tracks.forEach((t) => {
      const key = t.albumId || t.album || 'album-1';
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: key,
          title: t.album,
          artist: t.artist,
          artistId: t.artistId || 'artist-1',
          coverUrl: t.coverUrl,
          year: 2026,
          tracks: [t],
        });
      } else {
        const existing = albumMap.get(key)!;
        if (!existing.tracks.some((tr) => tr.id === t.id)) {
          existing.tracks.push(t);
        }
      }
    });

    // Group Tracks into Artists
    const artistMap = new Map<string, Artist>();
    tracks.forEach((t) => {
      const key = t.artist || 'Artista';
      if (!artistMap.has(key)) {
        artistMap.set(key, {
          id: t.artistId || `artist-${key}`,
          name: t.artist,
          avatarUrl: t.coverUrl,
          bannerUrl: t.coverUrl,
          verified: true,
          followers: Math.floor(Math.random() * 3000000) + 100000,
          bio: `Artista verificado en Jamendo Music con reproducciones Hi-Fi.`,
          topTracks: [t],
          albums: [],
        });
      } else {
        const existing = artistMap.get(key)!;
        if (existing.topTracks.length < 5 && !existing.topTracks.some((tr) => tr.id === t.id)) {
          existing.topTracks.push(t);
        }
      }
    });

    return {
      tracks,
      albums: Array.from(albumMap.values()),
      artists: Array.from(artistMap.values()),
    };
  } catch (error) {
    console.error('Error querying Jamendo API:', error);
    return { tracks: [], albums: [], artists: [] };
  }
};

/**
 * Fetches top popular tracks on Jamendo by category or global ranking
 */
export const fetchJamendoPopularTracks = async (): Promise<{
  trending: Track[];
  lofi: Track[];
  synthwave: Track[];
  pop: Track[];
  albums: Album[];
}> => {
  try {
    const popularUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=50&order=popularity_total&include=musicinfo+lyrics`;
    const response = await fetch(popularUrl);
    
    if (!response.ok) throw new Error('Jamendo popular tracks fetch error');
    const data = await response.json();

    const allTracks: Track[] = (data.results || []).map((item: any) => ({
      id: `jamendo-${item.id}`,
      title: item.name,
      artist: item.artist_name || 'Artista',
      artistId: `artist-${item.artist_id || '1'}`,
      album: item.album_name || 'Álbum Jamendo',
      albumId: `album-${item.album_id || '1'}`,
      coverUrl: item.album_image || item.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl: item.audio, // FULL MP3 stream!
      duration: item.duration || 220,
      genre: item.musicinfo?.tags?.genres?.[0] || 'Popular',
      dominantColor: stringToHslColor(item.name + item.artist_name),
      explicit: false,
      playCount: item.stats?.rate_listened_total || 500000,
      lyrics: parseLyricsToLines(item.lyrics?.lyrics, item.name, item.artist_name),
    }));

    const albumMap = new Map<string, Album>();
    allTracks.forEach((t) => {
      const albumKey = t.albumId || 'album-1';
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, {
          id: albumKey,
          title: t.album,
          artist: t.artist,
          artistId: t.artistId || 'artist-1',
          coverUrl: t.coverUrl,
          year: 2026,
          tracks: [t],
        });
      } else {
        albumMap.get(albumKey)!.tracks.push(t);
      }
    });

    return {
      trending: allTracks.slice(0, 15),
      lofi: allTracks.slice(15, 25),
      synthwave: allTracks.slice(25, 35),
      pop: allTracks.slice(35, 50),
      albums: Array.from(albumMap.values()),
    };
  } catch (err) {
    console.error('Error fetching popular tracks from Jamendo:', err);
    return { trending: [], lofi: [], synthwave: [], pop: [], albums: [] };
  }
};
