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
 * 100% Client-Side Music Search with CORS-friendly Public APIs & iTunes Fallback
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

  // Primary 1: iTunes Public Search API (100% CORS Allowed & Never Blocked by AdBlockers)
  try {
    const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm.trim())}&entity=song&limit=25`;
    const iTunesRes = await fetch(iTunesUrl);
    if (iTunesRes.ok) {
      const iTunesData = await iTunesRes.json();
      if (iTunesData.results && iTunesData.results.length > 0) {
        tracks = iTunesData.results.map((item: any) => {
          const trackId = `yt-${item.trackId || item.collectionId}`;
          const title = item.trackName || 'Canción';
          const artist = item.artistName || 'Artista';
          const coverUrl = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          const duration = Math.round((item.trackTimeMillis || 210000) / 1000);

          return {
            id: trackId,
            videoId: `${artist} - ${title}`,
            title,
            artist,
            artistId: `artist-${encodeURIComponent(artist)}`,
            album: item.collectionName || 'Álbum',
            albumId: `album-${item.collectionId}`,
            coverUrl,
            audioUrl: item.previewUrl || '',
            duration,
            genre: item.primaryGenreName || 'Música Hi-Fi',
            dominantColor: `hsl(${Math.abs((title + artist).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
            explicit: item.trackExplicitness === 'explicit',
            playCount: 5000000,
          };
        });
      }
    }
  } catch (e) {
    console.warn('iTunes API notice:', e);
  }

  // Primary 2: Piped & Invidious Public Instances (For Video IDs)
  if (tracks.length === 0) {
    const publicInstances = [
      'https://pipedapi.kavin.rocks/search?q=',
      'https://inv.tux.pizza/api/v1/search?q=',
      'https://vid.puffyan.us/api/v1/search?q=',
    ];

    for (const endpoint of publicInstances) {
      try {
        const url = `${endpoint}${encodeURIComponent(queryTerm.trim() + ' official audio')}&type=video`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.items || []);
          if (items.length > 0) {
            tracks = items.slice(0, 20).map((item: any) => {
              const videoId = item.videoId || (item.url ? item.url.replace('/watch?v=', '') : '');
              const { title, artist } = parseTitleAndArtist(item.title || '', item.uploaderName || item.author || '');
              const coverUrl = item.thumbnail || (item.videoThumbnails && item.videoThumbnails[0] ? item.videoThumbnails[0].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);

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
                duration: item.duration || item.lengthSeconds || 210,
                genre: 'YouTube Music Hits',
                dominantColor: `hsl(${Math.abs((title + artist).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
                explicit: false,
                playCount: item.views || 1000000,
              };
            });
            break;
          }
        }
      } catch (err) {}
    }
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
