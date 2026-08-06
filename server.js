import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
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
 * Extract YouTube Stream URL for Format 140 (M4A AAC)
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

  execFile(YTDLP_PATH, args, (error, stdout) => {
    if (!error && stdout.trim()) {
      const streamUrl = stdout.trim().split('\n')[0];
      streamUrlCache.set(cacheKey, {
        url: streamUrl,
        expiresAt: Date.now() + 4 * 60 * 60 * 1000,
      });
      return callback(null, streamUrl);
    }

    const fallbackTerm = `ytsearch1:${queryHint || cleanId} official audio`;
    const fallbackArgs = ['-g', '-f', '140/m4a/bestaudio', fallbackTerm];

    execFile(YTDLP_PATH, fallbackArgs, (fbErr, fbStdout) => {
      if (!fbErr && fbStdout.trim()) {
        const streamUrl = fbStdout.trim().split('\n')[0];
        streamUrlCache.set(cacheKey, {
          url: streamUrl,
          expiresAt: Date.now() + 4 * 60 * 60 * 1000,
        });
        return callback(null, streamUrl);
      }

      return callback(fbErr || new Error('Stream extraction failed'));
    });
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
 * Forwards Range header to YouTube CDN and returns 206 Partial Content for instant seeking
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

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: reqHeaders,
      };

      const proxyReq = https.request(options, (proxyRes) => {
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
 * 3. ULTRA-FAST SEARCH ENDPOINT (/api/search)
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

  const searchTerm = `ytsearch25:music.youtube.com ${query} official audio`;
  const args = [
    '--flat-playlist',
    '--print', '%(id)s||%(title)s||%(uploader)s||%(duration)s||%(view_count)s',
    searchTerm,
  ];

  execFile(YTDLP_PATH, args, (error, stdout) => {
    if (error) {
      console.error('yt-dlp search error:', error);
      return res.status(500).json({ error: 'Failed to search YouTube Music' });
    }

    try {
      const lines = stdout.trim().split('\n').filter(Boolean);
      const rawTracks = [];
      const albumMap = new Map();
      const artistMap = new Map();
      const host = req.get('host');
      const protocol = req.protocol;

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
        const albumTitle = `Álbum - ${title}`;
        const albumKey = `album-${artist}`;

        const track = {
          id: `yt-${videoId}`,
          videoId,
          title,
          artist,
          artistId: `artist-${encodeURIComponent(artist)}`,
          album: albumTitle,
          albumId: albumKey,
          coverUrl,
          audioUrl: `${protocol}://${host}/api/stream-audio?id=${videoId}&q=${encodeURIComponent(title + ' ' + artist)}`,
          duration,
          genre: 'YouTube Music Hits',
          dominantColor: `hsl(${Math.abs(videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360}, 75%, 42%)`,
          explicit: false,
          playCount: viewCount,
        };

        rawTracks.push(track);
      });

      const tracks = sinVersionesRepetidas(rawTracks);

      const responseObj = {
        tracks,
        albums: Array.from(albumMap.values()),
        artists: Array.from(artistMap.values()),
      };

      searchResultCache.set(cleanQuery, responseObj);
      return res.json(responseObj);
    } catch (e) {
      console.error('Search parsing error:', e);
      return res.status(500).json({ error: 'Parsing error' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🎵 Glassify Range Seeking Enabled Audio Server active on port ${PORT}`);
});
