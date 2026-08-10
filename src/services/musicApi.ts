import { Track, Album, Artist } from '../types';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'https://glassify-p280.onrender.com';

// In-Memory search cache
const searchCache = new Map<string, { tracks: Track[]; albums: Album[]; artists: Artist[] }>();

/**
 * Searches YouTube Music catalog via yt-dlp backend server on Render
 * Returns the EXACT official audio tracks extracted from YouTube Music
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

  try {
    const res = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(queryTerm.trim())}`);
    if (!res.ok) {
      throw new Error(`Backend HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const result = {
      tracks: data.tracks || [],
      albums: data.albums || [],
      artists: data.artists || [],
    };

    if (result.tracks.length > 0) {
      searchCache.set(cleanQuery, result);
    }

    return result;
  } catch (error) {
    console.error('Error fetching from YouTube Music backend:', error);
    return { tracks: [], albums: [], artists: [] };
  }
};

/**
 * Fetch top trending YouTube Music songs across a DIVERSE array of top global artists
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
