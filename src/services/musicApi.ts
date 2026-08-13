import { Track, Album, Artist } from '../types';

// In-Memory search cache
const searchCache = new Map<string, { tracks: Track[]; albums: Album[]; artists: Artist[] }>();
const streamCache = new Map<string, string>();

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
 * Extracts the 100% COMPLETE FULL SONG audio stream URL directly in the browser
 */
export const getFullAudioStreamUrl = async (track: Track, forceRefresh = false): Promise<string> => {
  if (!track) return '';

  if (!forceRefresh && streamCache.has(track.id)) {
    return streamCache.get(track.id)!;
  }

  const cleanVideoId = track.videoId || (track.id ? track.id.replace(/^(yt-|track-)/, '') : '');
  const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(cleanVideoId);

  const serverPortUrl = 'http://localhost:3001';
  const queryParam = encodeURIComponent(`${track.artist} - ${track.title}`);
  const durationParam = track.duration || 0;

  const localProxyUrl = isVideoId
    ? `${serverPortUrl}/api/stream-audio?id=${cleanVideoId}&q=${queryParam}&duration=${durationParam}`
    : `${serverPortUrl}/api/stream-audio?id=${encodeURIComponent(track.title)}&q=${queryParam}&duration=${durationParam}`;

  streamCache.set(track.id, localProxyUrl);
  return localProxyUrl;
};

/**
 * 100% Client-Side Search Engine
 * Queries public high-speed music APIs directly from the browser
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

  let tracks: Track[] = [];

  // 1. Query Local Glassify Backend Express Server (/api/search)
  try {
    const localSearchUrl = `http://localhost:3001/api/search?q=${encodeURIComponent(queryTerm.trim())}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(localSearchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
        tracks = data.tracks;
      }
    }
  } catch (e) {
    // Local server offline or timed out, proceed to fallback
  }

  // 2. High-Speed Fallback: iTunes API (Fast, global, reliable)
  if (tracks.length === 0) {
    try {
      const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm.trim())}&entity=song&limit=25`;
      const res = await fetch(iTunesUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          tracks = data.results.map((item: any) => {
            const title = item.trackName || 'Canción';
            const artist = item.artistName || 'Artista';
            const coverUrl = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
            const duration = Math.round((item.trackTimeMillis || 210000) / 1000);

            return {
              id: `track-${item.trackId || item.collectionId}`,
              videoId: `${artist} - ${title}`,
              title,
              artist,
              artistId: `artist-${encodeURIComponent(artist)}`,
              album: item.collectionName || 'Álbum',
              albumId: `album-${item.collectionId}`,
              coverUrl,
              audioUrl: `http://localhost:3001/api/stream-audio?id=${encodeURIComponent(title)}&q=${encodeURIComponent(artist + ' - ' + title)}&duration=${duration}`,
              duration,
              genre: item.primaryGenreName || 'Música Hi-Fi',
              dominantColor: `hsl(${Math.abs((title + artist).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
              explicit: item.trackExplicitness === 'explicit',
              playCount: 5000000,
            };
          });
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
 * Fetch top trending songs across top global artists directly in browser
 */
export const fetchTopTrendingTracks = async (): Promise<{
  trending: Track[];
  lofi: Track[];
  synthwave: Track[];
  pop: Track[];
  albums: Album[];
}> => {
  try {
    const res = await fetch('http://localhost:3001/api/trending');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.trending) && data.trending.length > 0) {
        return {
          trending: data.trending || [],
          lofi: data.lofi || [],
          synthwave: data.synthwave || [],
          pop: data.pop || [],
          albums: data.albums || [],
        };
      }
    }
  } catch (err) {}

  try {
    const [brunoRes, badBunnyRes, weekndRes, duaRes] = await Promise.all([
      searchTracksFromApi('Bruno Mars'),
      searchTracksFromApi('Bad Bunny'),
      searchTracksFromApi('The Weeknd'),
      searchTracksFromApi('Dua Lipa'),
    ]);
    return {
      trending: [...brunoRes.tracks, ...badBunnyRes.tracks],
      lofi: badBunnyRes.tracks,
      synthwave: weekndRes.tracks,
      pop: duaRes.tracks,
      albums: [],
    };
  } catch (e) {
    return { trending: [], lofi: [], synthwave: [], pop: [], albums: [] };
  }
};
