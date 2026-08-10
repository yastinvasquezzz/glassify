import { Track, Album, Artist } from '../types';

// In-Memory search cache
const searchCache = new Map<string, { tracks: Track[]; albums: Album[]; artists: Artist[] }>();

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
 * 100% Client-Side Search Engine (0 Backend Dependencies)
 * Queries public high-speed music catalog APIs directly from the browser
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
            audioUrl: item.previewUrl || '',
            duration,
            genre: item.primaryGenreName || 'Música Hi-Fi',
            dominantColor: `hsl(${Math.abs((title + artist).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
            explicit: item.trackExplicitness === 'explicit',
            playCount: 5000000,
          };
        });
      }
    }
  } catch (e) {
    console.warn('Client-side search notice:', e);
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
