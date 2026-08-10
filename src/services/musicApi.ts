import { Track, Album, Artist } from '../types';

// In-Memory search cache
const searchCache = new Map<string, { tracks: Track[]; albums: Album[]; artists: Artist[] }>();

function parseTitleAndArtist(rawTitle: string, author: string) {
  let title = rawTitle || '';
  let artist = author || 'Artista';

  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  title = title
    .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '')
    .replace(/\s*\/\/\s*.*$/g, '')
    .replace(/\s*\|\s*.*$/g, '')
    .trim();

  artist = artist
    .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '')
    .replace(/\s*-\s*Topic$/i, '')
    .trim();

  return {
    title: title || rawTitle,
    artist: artist || author || 'Artista',
  };
}

function filterUniqueTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const result: Track[] = [];

  for (const t of tracks) {
    const key = `${t.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${t.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(t);
    }
  }
  return result;
}

/**
 * 100% Client-Side YouTube Music Search
 * Queries public high-speed CORS music APIs directly from the browser without any backend
 */
export const searchTracksFromApi = async (queryTerm: string): Promise<{
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}> => {
  if (!queryTerm || queryTerm.trim() === '') {
    return { tracks: [], albums: [], artists: [] };
  }

  const cleanQuery = queryTerm.trim().toLowerCase();

  if (searchCache.has(cleanQuery)) {
    return searchCache.get(cleanQuery)!;
  }

  const publicInstances = [
    'https://inv.tux.pizza/api/v1/search',
    'https://vid.puffyan.us/api/v1/search',
    'https://invidious.drgns.space/api/v1/search',
    'https://invidious.nerdvpn.de/api/v1/search',
  ];

  let rawItems: any[] = [];

  // Try Client-Side Public Music Search Instances
  for (const endpoint of publicInstances) {
    try {
      const url = `${endpoint}?q=${encodeURIComponent(queryTerm.trim() + ' official audio')}&type=video`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          rawItems = data;
          break;
        }
      }
    } catch (err) {
      // Try next public instance
    }
  }

  let tracks: Track[] = [];

  if (rawItems.length > 0) {
    tracks = rawItems.map((item) => {
      const videoId = item.videoId;
      const { title, artist } = parseTitleAndArtist(item.title || '', item.author || '');
      const coverUrl = item.videoThumbnails && item.videoThumbnails[0]
        ? item.videoThumbnails[0].url
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        id: `yt-${videoId}`,
        videoId,
        title,
        artist,
        artistId: `artist-${encodeURIComponent(artist)}`,
        album: `Álbum - ${title}`,
        albumId: `album-${artist}`,
        coverUrl,
        audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
        duration: item.lengthSeconds || 210,
        genre: 'YouTube Music Hits',
        dominantColor: `hsl(${Math.abs(videoId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
        explicit: false,
        playCount: item.viewCount || 1000000,
      };
    });
  } else {
    // Client-Side iTunes API Fallback
    try {
      const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm.trim())}&entity=song&limit=20`;
      const iTunesRes = await fetch(iTunesUrl);
      if (iTunesRes.ok) {
        const iTunesData = await iTunesRes.json();
        if (iTunesData.results && iTunesData.results.length > 0) {
          tracks = iTunesData.results.map((item: any) => ({
            id: `yt-${item.trackId || item.collectionId}`,
            videoId: `yt-${item.trackId || item.collectionId}`,
            title: item.trackName || 'Canción',
            artist: item.artistName || 'Artista',
            artistId: `artist-${encodeURIComponent(item.artistName || '')}`,
            album: item.collectionName || 'Álbum',
            albumId: `album-${item.collectionId}`,
            coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
            audioUrl: item.previewUrl || '',
            duration: Math.round((item.trackTimeMillis || 210000) / 1000),
            genre: item.primaryGenreName || 'Música Hi-Fi',
            dominantColor: 'hsl(160, 84%, 39%)',
            explicit: item.trackExplicitness === 'explicit',
            playCount: 5000000,
          }));
        }
      }
    } catch (e) {}
  }

  const uniqueTracks = filterUniqueTracks(tracks);
  const result = { tracks: uniqueTracks, albums: [], artists: [] };

  if (uniqueTracks.length > 0) {
    searchCache.set(cleanQuery, result);
  }

  return result;
};

/**
 * Fetch top trending YouTube Music songs across global artists
 */
export const fetchTopTrendingTracks = async (): Promise<{
  trending: Track[];
  lofi: Track[];
  synthwave: Track[];
  pop: Track[];
  albums: Album[];
}> => {
  try {
    const [brunoRes, badBunnyRes, weekndRes, duaRes, taylorRes, drakeRes] = await Promise.all([
      searchTracksFromApi('Bruno Mars'),
      searchTracksFromApi('Bad Bunny'),
      searchTracksFromApi('The Weeknd'),
      searchTracksFromApi('Dua Lipa'),
      searchTracksFromApi('Taylor Swift'),
      searchTracksFromApi('Drake'),
    ]);

    const diverseTrending: Track[] = [];
    const maxLength = Math.max(
      brunoRes.tracks.length,
      badBunnyRes.tracks.length,
      weekndRes.tracks.length,
      duaRes.tracks.length,
      taylorRes.tracks.length,
      drakeRes.tracks.length
    );

    for (let i = 0; i < maxLength; i++) {
      if (brunoRes.tracks[i]) diverseTrending.push(brunoRes.tracks[i]);
      if (badBunnyRes.tracks[i]) diverseTrending.push(badBunnyRes.tracks[i]);
      if (weekndRes.tracks[i]) diverseTrending.push(weekndRes.tracks[i]);
      if (duaRes.tracks[i]) diverseTrending.push(duaRes.tracks[i]);
      if (taylorRes.tracks[i]) diverseTrending.push(taylorRes.tracks[i]);
      if (drakeRes.tracks[i]) diverseTrending.push(drakeRes.tracks[i]);
    }

    return {
      trending: diverseTrending.slice(0, 15),
      lofi: badBunnyRes.tracks.slice(0, 8),
      synthwave: weekndRes.tracks.slice(0, 8),
      pop: duaRes.tracks.slice(0, 8),
      albums: [...brunoRes.albums, ...badBunnyRes.albums, ...weekndRes.albums],
    };
  } catch (err) {
    console.error('Error fetching trending tracks:', err);
    return { trending: [], lofi: [], synthwave: [], pop: [], albums: [] };
  }
};
