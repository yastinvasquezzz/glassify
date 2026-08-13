import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Range', 'Origin', 'Content-Type', 'Accept'],
}));

app.use(express.json());

const isWin = process.platform === 'win32';
const YTDLP_PATH = isWin
  ? path.join(__dirname, 'bin', 'yt-dlp.exe')
  : (process.env.YTDLP_PATH || 'yt-dlp');

// In-memory stream and search caches
const streamUrlCache = new Map();
const searchResultCache = new Map();

/**
 * 0. ROOT HEALTH ROUTE
 */
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Glassify YouTube Music Hi-Fi Audio API',
    version: '1.0.0',
    endpoints: {
      search: '/api/search?q=query',
      streamAudio: '/api/stream-audio?id=videoId',
      streamUrl: '/api/stream-url?id=videoId',
    },
  });
});

/**
 * Helper: Fetch JSON via HTTPS
 */
function fetchHttpsJson(urlStr) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const reqOpts = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      };

      const req = https.request(reqOpts, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fallback HTTPS Search via Invidious instances
 */
async function fallbackHttpsSearch(queryTerm) {
  const instances = [
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.drgns.space',
    'https://invidious.nerdvpn.de',
  ];

  for (const instance of instances) {
    try {
      const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(queryTerm + ' official audio')}&type=video`;
      const data = await fetchHttpsJson(searchUrl);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      // Try next instance silently
    }
  }
  return [];
}

/**
 * Fallback Audio Stream URL Fetcher
 */
async function fallbackHttpsStreamUrl(videoId) {
  const instances = [
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.drgns.space',
  ];

  for (const instance of instances) {
    try {
      const infoUrl = `${instance}/api/v1/videos/${videoId}`;
      const data = await fetchHttpsJson(infoUrl);
      if (data && Array.isArray(data.adaptiveFormats)) {
        const audioFormat = data.adaptiveFormats.find(
          (f) => f.type && f.type.includes('audio') && (f.container === 'm4a' || f.container === 'mp4')
        ) || data.adaptiveFormats.find((f) => f.type && f.type.includes('audio'));

        if (audioFormat && audioFormat.url) {
          return audioFormat.url;
        }
      }
    } catch (e) {}
  }
  return null;
}

const NODE_EXE_PATH = 'C:\\Users\\Vasquez\\.gemini\\antigravity\\bin\\node.exe';

/**
 * Helper: Intelligent Metadata Matching for Spotify/Search track against YouTube
 */
async function matchBestYouTubeVideo({ title, artist, duration }) {
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const targetDuration = parseFloat(duration) || 0;

  const searchQueries = [];
  if (cleanArtist && cleanTitle) {
    searchQueries.push(`"${cleanArtist} - ${cleanTitle}" official audio`);
    searchQueries.push(`${cleanArtist} ${cleanTitle}`);
  } else {
    searchQueries.push(`${cleanTitle || cleanArtist} official audio`);
    searchQueries.push(`${cleanTitle || cleanArtist}`);
  }

  for (const searchQuery of searchQueries) {
    const args = [
      '--no-check-certificates',
      '--no-warnings',
      '--js-runtimes', `node:${NODE_EXE_PATH}`,
      '--flat-playlist',
      '--print', '%(id)s||%(title)s||%(uploader)s||%(duration)s||%(view_count)s',
      `ytsearch10:${searchQuery}`,
    ];

    const matchResult = await new Promise((resolve) => {
      execFile(YTDLP_PATH, args, (error, stdout) => {
        if (!error && stdout.trim()) {
          const lines = stdout.trim().split('\n').filter(Boolean);
          const candidates = [];

          lines.forEach((line) => {
            const parts = line.split('||');
            if (parts.length < 2) return;

            const videoId = parts[0].trim();
            const rawTitle = parts[1].trim();
            const uploader = parts[2] ? parts[2].trim() : '';
            const vidDuration = parts[3] && !isNaN(parseFloat(parts[3])) ? parseFloat(parts[3]) : 0;
            const viewCount = parts[4] && !isNaN(parseInt(parts[4], 10)) ? parseInt(parts[4], 10) : 0;

            // Rule 1: Discard obvious non-song spam unless title specifies it
            const isSpam = /\b(reaction|review|vlog|amv|dance cover|guitar cover|piano cover|tutorial|karaoke)\b/i.test(rawTitle);
            const origHasSpam = /\b(cover|remix|slowed)\b/i.test(cleanTitle);
            if (isSpam && !origHasSpam) {
              return;
            }

            let score = 100;

            // Rule 2: Duration comparison (Penalize instead of hard discarding unless > 120s diff)
            let durationDiff = 0;
            if (targetDuration > 0 && vidDuration > 0) {
              durationDiff = Math.abs(vidDuration - targetDuration);
              if (durationDiff > 120) {
                return; // Discard compilation or long video
              }
              score -= Math.min(durationDiff * 3, 90);
              if (durationDiff <= 10) {
                score += 50; // Bonus for close duration match
              }
            }

            // Rule 3: Official Channel Bonus (+60)
            const isTopic = /- Topic$/i.test(uploader);
            const isVevo = /vevo/i.test(uploader);
            const isArtistChannel = cleanArtist && uploader.toLowerCase().includes(cleanArtist.toLowerCase());

            if (isTopic || isVevo || isArtistChannel) {
              score += 60;
            }

            // Official Title Bonus (+30)
            if (/official audio|official audio track|official video/i.test(rawTitle)) {
              score += 30;
            }

            // Popularity bonus
            if (viewCount > 100000) score += 10;
            if (viewCount > 1000000) score += 10;

            candidates.push({
              videoId,
              title: rawTitle,
              uploader,
              duration: vidDuration,
              score,
              viewCount,
            });
          });

          if (candidates.length > 0) {
            candidates.sort((a, b) => b.score - a.score);
            return resolve(candidates[0]);
          }
        }
        resolve(null);
      });
    });

    if (matchResult) {
      return matchResult;
    }
  }

  // Fallback HTTPS search if yt-dlp returns no candidates
  try {
    const fallbackItems = await fallbackHttpsSearch(`${cleanArtist} ${cleanTitle}`);
    if (fallbackItems.length > 0) {
      const item = fallbackItems[0];
      return {
        videoId: item.videoId,
        title: item.title,
        uploader: item.author,
        duration: item.lengthSeconds || targetDuration || 210,
        score: 50,
      };
    }
  } catch (e) {}

  return null;
}

/**
 * Extract YouTube Stream URL for Format (M4A / Opus / BestAudio) with Fallback
 */
function getOrFetchStreamUrl(idOrQuery, queryHint, targetDuration, callback) {
  if (typeof targetDuration === 'function') {
    callback = targetDuration;
    targetDuration = 0;
  }

  if (!idOrQuery) return callback(new Error('Missing idOrQuery'));

  const cleanId = idOrQuery.trim().replace(/^yt-/, '');
  const cacheKey = `${cleanId}_${targetDuration || 0}`.toLowerCase();

  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return callback(null, cached.url);
  }

  const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(cleanId);

  const fetchStreamForId = (vId, cb) => {
    const targetTerm = `https://www.youtube.com/watch?v=${vId}`;
    const args = [
      '--no-check-certificates',
      '--no-warnings',
      '--js-runtimes', `node:${NODE_EXE_PATH}`,
      '-g',
      '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/251/140/bestaudio',
      targetTerm,
    ];

    execFile(YTDLP_PATH, args, async (error, stdout) => {
      if (!error && stdout.trim()) {
        const streamUrl = stdout.trim().split('\n')[0];
        streamUrlCache.set(cacheKey, {
          url: streamUrl,
          expiresAt: Date.now() + 3 * 60 * 60 * 1000,
        });
        return cb(null, streamUrl);
      }

      return cb(error || new Error('Stream extraction failed'));
    });
  };

  const resolveAndFetch = async () => {
    const searchTerm = queryHint || cleanId;

    if (isVideoId) {
      fetchStreamForId(cleanId, async (err, streamUrl) => {
        if (!err && streamUrl) {
          return callback(null, streamUrl);
        }

        // Primary video ID failed, search for alternative matching video!
        const match = await matchBestYouTubeVideo({
          title: searchTerm,
          artist: '',
          duration: targetDuration,
        });

        if (match && match.videoId && match.videoId !== cleanId) {
          return fetchStreamForId(match.videoId, callback);
        }

        return callback(err || new Error('Stream extraction failed'));
      });
    } else {
      const match = await matchBestYouTubeVideo({
        title: searchTerm,
        artist: '',
        duration: targetDuration,
      });

      if (match && match.videoId) {
        return fetchStreamForId(match.videoId, callback);
      } else {
        return callback(new Error('No matching video found'));
      }
    }
  };

  resolveAndFetch();
}

function parseTitleAndArtist(rawTitle, uploader) {
  let title = rawTitle || '';
  let artist = uploader || 'Artista';

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
    artist: artist || uploader || 'Artista',
  };
}

function sinVersionesRepetidas(canciones) {
  if (!canciones || canciones.length === 0) return [];
  const vistas = new Set();
  const resultado = [];

  canciones.forEach((c) => {
    const k = (c.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!k || vistas.has(k)) return;
    vistas.add(k);
    resultado.push(c);
  });

  return resultado;
}

/**
 * 1. HIGH-PERFORMANCE AUDIO STREAM PROXY WITH FULL HTTP RANGE & SEEKING SUPPORT
 */
app.all('/api/stream-audio', (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
    return res.sendStatus(204);
  }

  const id = req.query.id;
  const queryHint = req.query.q;
  const targetDuration = parseFloat(req.query.duration) || 0;

  if (!id || typeof id !== 'string') {
    return res.status(400).send('Audio ID parameter is required');
  }

  getOrFetchStreamUrl(id, queryHint, targetDuration, (err, googlevideoUrl) => {
    if (err || !googlevideoUrl) {
      console.error('Stream url extraction error:', err);
      return res.status(500).send('Audio extraction failed');
    }

    try {
      const parsedUrl = new URL(googlevideoUrl);
      const reqHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Referer': 'https://music.youtube.com/',
      };

      if (req.headers.range) {
        reqHeaders['Range'] = req.headers.range;
      }

      const transport = parsedUrl.protocol === 'http:' ? http : https;
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'http:' ? 80 : 443),
        path: parsedUrl.pathname + parsedUrl.search,
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: reqHeaders,
      };

      const proxyReq = transport.request(options, (proxyRes) => {
        const resHeaders = {
          'Content-Type': proxyRes.headers['content-type'] || 'audio/mp4',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
          'Cache-Control': 'public, max-age=3600',
        };

        if (proxyRes.headers['content-length']) {
          resHeaders['Content-Length'] = proxyRes.headers['content-length'];
        }
        if (proxyRes.headers['content-range']) {
          resHeaders['Content-Range'] = proxyRes.headers['content-range'];
        }

        res.writeHead(proxyRes.statusCode || 200, resHeaders);
        if (req.method === 'HEAD') {
          res.end();
        } else {
          proxyRes.pipe(res);
        }
      });

      proxyReq.on('error', (proxyErr) => {
        console.error('Proxy stream error:', proxyErr);
        if (!res.headersSent) res.status(500).send('Proxy error');
      });

      proxyReq.end();
    } catch (e) {
      console.error('URL parse error:', e);
      return res.status(500).send('Invalid stream URL');
    }
  });
});

/**
 * 2. STREAM URL ENDPOINT
 */
app.get('/api/stream-url', (req, res) => {
  const id = req.query.id;
  const queryHint = req.query.q;
  const targetDuration = parseFloat(req.query.duration) || 0;

  getOrFetchStreamUrl(id, queryHint, targetDuration, (err, streamUrl) => {
    if (err || !streamUrl) {
      return res.status(500).json({ error: 'Stream extraction failed' });
    }
    const host = req.get('host');
    const protocol = req.protocol;
    return res.json({ streamUrl: `${protocol}://${host}/api/stream-audio?id=${id}&q=${encodeURIComponent(queryHint || '')}&duration=${targetDuration}` });
  });
});

/**
 * 2.5. INTELLIGENT METADATA MATCHING ENDPOINT (/api/match-track)
 * Accepts Spotify track details (title, artist, duration) and finds exact YouTube Audio match.
 */
app.get('/api/match-track', async (req, res) => {
  const title = req.query.title || '';
  const artist = req.query.artist || '';
  const duration = parseFloat(req.query.duration) || 0;

  if (!title && !artist) {
    return res.status(400).json({ error: 'Title or artist parameter is required' });
  }

  const match = await matchBestYouTubeVideo({ title, artist, duration });
  if (!match) {
    return res.status(404).json({ error: 'No suitable audio match found' });
  }

  const host = req.get('host');
  const protocol = req.protocol;

  const audioStreamUrl = `${protocol}://${host}/api/stream-audio?id=${match.videoId}&q=${encodeURIComponent(title + ' ' + artist)}&duration=${duration}`;
  const coverUrl = `https://i.ytimg.com/vi/${match.videoId}/hqdefault.jpg`;

  return res.json({
    videoId: match.videoId,
    title: match.title,
    uploader: match.uploader,
    duration: match.duration,
    audioStreamUrl,
    coverUrl,
    score: match.score,
  });
});

/**
 * 2.8. YOUTUBE MUSIC TRENDING & CHARTS ENDPOINT (/api/trending)
 */
app.get('/api/trending', async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;

  const categories = [
    { key: 'trending', query: 'top global music hits' },
    { key: 'lofi', query: 'lofi chill beats' },
    { key: 'synthwave', query: 'synthwave retro hits' },
    { key: 'pop', query: 'pop music hits' },
    { key: 'urbano', query: 'latin urbano reggaeton' },
  ];

  const results = {};

  for (const cat of categories) {
    const args = [
      '--no-check-certificates',
      '--no-warnings',
      '--js-runtimes', `node:${NODE_EXE_PATH}`,
      '--flat-playlist',
      '--print', '%(id)s||%(title)s||%(uploader)s||%(duration)s||%(view_count)s',
      `ytsearch10:music.youtube.com ${cat.query}`,
    ];

    const tracks = await new Promise((resolve) => {
      execFile(YTDLP_PATH, args, (error, stdout) => {
        if (!error && stdout.trim()) {
          const lines = stdout.trim().split('\n').filter(Boolean);
          const genreTracks = [];

          lines.forEach((line) => {
            const parts = line.split('||');
            if (parts.length < 2) return;

            const videoId = parts[0].trim();
            const rawTitle = parts[1].trim();
            const uploader = parts[2] ? parts[2].trim() : 'Artista';
            const duration = parts[3] && !isNaN(parseFloat(parts[3])) ? parseFloat(parts[3]) : 210;
            const viewCount = parts[4] && !isNaN(parseInt(parts[4], 10)) ? parseInt(parts[4], 10) : 1000000;

            const { title, artist } = parseTitleAndArtist(rawTitle, uploader);
            const coverUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            genreTracks.push({
              id: `yt-${videoId}`,
              videoId,
              title,
              artist,
              artistId: `artist-${encodeURIComponent(artist)}`,
              album: `Álbum - ${title}`,
              albumId: `album-${artist}`,
              coverUrl,
              audioUrl: `${protocol}://${host}/api/stream-audio?id=${videoId}&q=${encodeURIComponent(title + ' ' + artist)}`,
              duration,
              genre: 'YouTube Music Hits',
              dominantColor: `hsl(${Math.abs(videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
              explicit: false,
              playCount: viewCount,
            });
          });
          return resolve(sinVersionesRepetidas(genreTracks));
        }
        resolve([]);
      });
    });

    results[cat.key] = tracks;
  }

  return res.json({
    trending: results.trending || [],
    lofi: results.lofi || [],
    synthwave: results.synthwave || [],
    pop: results.pop || [],
    urbano: results.urbano || [],
    albums: [],
  });
});

/**
 * 3. ULTRA-FAST DUAL-LAYER SEARCH ENDPOINT (/api/search)
 */
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const cleanQuery = query.trim().toLowerCase();

  if (searchResultCache.has(cleanQuery)) {
    return res.json(searchResultCache.get(cleanQuery));
  }

  const host = req.get('host');
  const protocol = req.protocol;

  const searchTerm = `ytsearch25:music.youtube.com ${query} official audio`;
  const args = [
    '--no-check-certificates',
    '--no-warnings',
    '--js-runtimes', `node:${NODE_EXE_PATH}`,
    '--flat-playlist',
    '--print', '%(id)s||%(title)s||%(uploader)s||%(duration)s||%(view_count)s',
    searchTerm,
  ];

  execFile(YTDLP_PATH, args, async (error, stdout) => {
    if (!error && stdout.trim()) {
      try {
        const lines = stdout.trim().split('\n').filter(Boolean);
        const rawTracks = [];

        lines.forEach((line) => {
          const parts = line.split('||');
          if (parts.length < 2) return;

          const videoId = parts[0].trim();
          const rawTitle = parts[1].trim();
          const uploader = parts[2] ? parts[2].trim() : 'Artista';
          const duration = parts[3] && !isNaN(parseFloat(parts[3])) ? parseFloat(parts[3]) : 210;
          const viewCount = parts[4] && !isNaN(parseInt(parts[4], 10)) ? parseInt(parts[4], 10) : 1000000;

          if (/\b(reaction|review|vlog|amv|cover by|dance cover|guitar cover|piano cover|instrumental cover|tutorial)\b/i.test(rawTitle)) {
            return;
          }

          const { title, artist } = parseTitleAndArtist(rawTitle, uploader);
          const coverUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          rawTracks.push({
            id: `yt-${videoId}`,
            videoId,
            title,
            artist,
            artistId: `artist-${encodeURIComponent(artist)}`,
            album: `Álbum - ${title}`,
            albumId: `album-${artist}`,
            coverUrl,
            audioUrl: `${protocol}://${host}/api/stream-audio?id=${videoId}&q=${encodeURIComponent(title + ' ' + artist)}`,
            duration,
            genre: 'YouTube Music Hits',
            dominantColor: `hsl(${Math.abs(videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
            explicit: false,
            playCount: viewCount,
          });
        });

        const tracks = sinVersionesRepetidas(rawTracks);
        const responseObj = { tracks, albums: [], artists: [] };
        if (tracks.length > 0) {
          searchResultCache.set(cleanQuery, responseObj);
          return res.json(responseObj);
        }
      } catch (e) {}
    }

    // HTTPS DUAL-LAYER FALLBACK IF YT-DLP FAILS OR IS MISSING ON RENDER
    try {
      const items = await fallbackHttpsSearch(cleanQuery);
      const rawTracks = items.map((item) => {
        const videoId = item.videoId;
        const rawTitle = item.title || '';
        const author = item.author || 'Artista';
        const duration = item.lengthSeconds || 210;

        const { title, artist } = parseTitleAndArtist(rawTitle, author);
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
          audioUrl: `${protocol}://${host}/api/stream-audio?id=${videoId}&q=${encodeURIComponent(title + ' ' + artist)}`,
          duration,
          genre: 'YouTube Music Hits',
          dominantColor: `hsl(${Math.abs(videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
          explicit: false,
          playCount: item.viewCount || 1000000,
        };
      });

      const tracks = sinVersionesRepetidas(rawTracks);
      const responseObj = { tracks, albums: [], artists: [] };
      searchResultCache.set(cleanQuery, responseObj);
      return res.json(responseObj);
    } catch (fallbackErr) {
      console.error('Dual layer fallback error:', fallbackErr);
      return res.status(500).json({ error: 'Search failed' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🎵 Glassify Dual-Layer Audio Server active on port ${PORT}`);
});
