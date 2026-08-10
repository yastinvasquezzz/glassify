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

/**
 * Extract YouTube Stream URL for Format 140 (M4A AAC) with Fallback
 */
function getOrFetchStreamUrl(idOrQuery, queryHint, callback) {
  if (!idOrQuery) return callback(new Error('Missing idOrQuery'));

  const cleanId = idOrQuery.trim().replace(/^yt-/, '');
  const cacheKey = cleanId.toLowerCase();

  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return callback(null, cached.url);
  }

  const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(cleanId);
  const targetTerm = isVideoId
    ? `https://www.youtube.com/watch?v=${cleanId}`
    : `ytsearch1:${queryHint || cleanId} official audio`;

  const args = [
    '-g',
    '-f', '140/m4a/bestaudio',
    targetTerm,
  ];

  execFile(YTDLP_PATH, args, async (error, stdout) => {
    if (!error && stdout.trim()) {
      const streamUrl = stdout.trim().split('\n')[0];
      streamUrlCache.set(cacheKey, {
        url: streamUrl,
        expiresAt: Date.now() + 4 * 60 * 60 * 1000,
      });
      return callback(null, streamUrl);
    }

    // Try HTTPS Fallback
    if (isVideoId) {
      const fallbackUrl = await fallbackHttpsStreamUrl(cleanId);
      if (fallbackUrl) {
        streamUrlCache.set(cacheKey, {
          url: fallbackUrl,
          expiresAt: Date.now() + 4 * 60 * 60 * 1000,
        });
        return callback(null, fallbackUrl);
      }
    }

    return callback(error || new Error('Stream extraction failed'));
  });
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
app.options('/api/stream-audio', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
  res.sendStatus(204);
});

app.get('/api/stream-audio', (req, res) => {
  const id = req.query.id;
  const queryHint = req.query.q;

  if (!id || typeof id !== 'string') {
    return res.status(400).send('Audio ID parameter is required');
  }

  getOrFetchStreamUrl(id, queryHint, (err, googlevideoUrl) => {
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
        method: 'GET',
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
        proxyRes.pipe(res);
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

  getOrFetchStreamUrl(id, queryHint, (err, streamUrl) => {
    if (err || !streamUrl) {
      return res.status(500).json({ error: 'Stream extraction failed' });
    }
    const host = req.get('host');
    const protocol = req.protocol;
    return res.json({ streamUrl: `${protocol}://${host}/api/stream-audio?id=${id}&q=${encodeURIComponent(queryHint || '')}` });
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
