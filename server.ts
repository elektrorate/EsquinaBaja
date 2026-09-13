import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';

const execFileAsync = promisify(execFile);
const YTDLP_BIN = process.env.YTDLP_BIN || path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

const app = express();
const PORT = Number(process.env.PORT) || 8040;

app.use(express.json());

// CORS for online backend (Render / Firebase Hosting)
app.use('/api', (req, res, next) => {
  const allowedOrigins = [
    'https://esquinabaja-e4009.web.app',
    'https://elektrorate.github.io',
    'http://localhost:8040',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.some((o) => origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Helper to determine platform from URL
function detectPlatform(urlStr: string): 'tiktok' | 'instagram' | 'unknown' {
  const lower = urlStr.toLowerCase().trim();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  return 'unknown';
}

// Format numbers
function formatStat(num?: number): number | undefined {
  return typeof num === 'number' ? num : undefined;
}

// 1. Tikwm / TikTok extraction
async function extractTikTok(url: string) {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Tikwm status: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 0 && data.data) {
      const item = data.data;
      const baseDomain = 'https://www.tikwm.com';
      const playUrl = item.play?.startsWith('http') ? item.play : `${baseDomain}${item.play}`;
      const hdPlayUrl = item.hdplay ? (item.hdplay.startsWith('http') ? item.hdplay : `${baseDomain}${item.hdplay}`) : playUrl;
      const musicUrl = item.music ? (item.music.startsWith('http') ? item.music : `${baseDomain}${item.music}`) : undefined;
      const coverUrl = item.cover?.startsWith('http') ? item.cover : `${baseDomain}${item.cover}`;

      return {
        id: item.id || `tt_${Date.now()}`,
        platform: 'tiktok' as const,
        originalUrl: url,
        title: item.title || 'Video de TikTok',
        author: {
          name: item.author?.nickname || item.author?.unique_id || 'TikTok Creator',
          username: item.author?.unique_id ? `@${item.author.unique_id}` : '@tiktok',
          avatar: item.author?.avatar?.startsWith('http') ? item.author.avatar : (item.author?.avatar ? `${baseDomain}${item.author.avatar}` : undefined),
        },
        thumbnail: coverUrl,
        duration: item.duration || 0,
        downloadOptions: {
          videoNoWatermark: playUrl,
          videoHd: hdPlayUrl,
          audio: musicUrl,
          thumbnail: coverUrl,
        },
        stats: {
          likes: formatStat(item.digg_count),
          views: formatStat(item.play_count),
          shares: formatStat(item.share_count),
          comments: formatStat(item.comment_count),
        },
        createdAt: item.create_time ? new Date(item.create_time * 1000).toISOString() : undefined,
      };
    } else {
      throw new Error(data.msg || 'No se pudo procesar el video de TikTok');
    }
  } catch (err: any) {
    console.error('TikTok extraction error:', err.message);
    throw err;
  }
}

// yt-dlp fallback: extracts direct media URL + metadata without any API key/quota
async function extractWithYtDlp(url: string) {
  try {
    const { stdout } = await execFileAsync(
      YTDLP_BIN,
      ['--no-warnings', '--no-playlist', '-J', url],
      { timeout: 60000, windowsHide: true, maxBuffer: 15 * 1024 * 1024 }
    );
    const info = JSON.parse(stdout);
    let videoUrl = info.url || '';
    if (videoUrl && !videoUrl.startsWith('http')) videoUrl = '';
    if (!videoUrl && Array.isArray(info.formats)) {
      const f = [...info.formats].reverse().find((x: any) => x.url && String(x.url).startsWith('http'));
      videoUrl = f?.url || '';
    }
    if (!videoUrl) return null;
    return {
      videoUrl,
      title: typeof info.title === 'string' ? info.title : undefined,
      thumbnail: typeof info.thumbnail === 'string' ? info.thumbnail : undefined,
      duration: typeof info.duration === 'number' ? info.duration : undefined,
    };
  } catch (err: any) {
    console.warn('yt-dlp extraction failed:', err.message);
    return null;
  }
}

// 2. Instagram extraction
async function extractInstagram(url: string) {
  try {
    // Clean URL
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');
    
    // First, try fetching oEmbed for author, title, thumbnail
    let oEmbedData: any = null;
    try {
      const oEmbedRes = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        }
      });
      if (oEmbedRes.ok) {
        oEmbedData = await oEmbedRes.json();
      }
    } catch {
      // ignore oembed error
    }

    // Attempt direct HTML fetch to find og:video or script JSON
    let videoUrl = '';
    let coverUrl = oEmbedData?.thumbnail_url || '';
    let title = oEmbedData?.title || '';
    let authorName = oEmbedData?.author_name || 'Instagram User';

    try {
      const htmlRes = await fetch(cleanUrl + '/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (htmlRes.ok) {
        const html = await htmlRes.text();

        // Extract og:video
        const videoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);
        if (videoMatch && videoMatch[1]) {
          videoUrl = videoMatch[1].replace(/&amp;/g, '&');
        }

        // Extract og:image
        if (!coverUrl) {
          const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
          if (imgMatch && imgMatch[1]) {
            coverUrl = imgMatch[1].replace(/&amp;/g, '&');
          }
        }

        // Extract og:title
        if (!title) {
          const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                             html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].replace(/&amp;/g, '&');
          }
        }
      }
    } catch (e) {
      console.warn('Instagram HTML fetch warning:', e);
    }

    // If RAPIDAPI_KEY is configured in environment, use RapidAPI Instagram Downloader
    if (process.env.RAPIDAPI_KEY) {
      try {
        const rapidRes = await fetch('https://instagram-video-downloader13.p.rapidapi.com/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'instagram-video-downloader13.p.rapidapi.com'
          },
          body: JSON.stringify({ url: cleanUrl })
        });
        if (rapidRes.ok) {
          const rapidData = await rapidRes.json();
          if (rapidData.url || rapidData.video_url || rapidData.download_url) {
            videoUrl = rapidData.url || rapidData.video_url || rapidData.download_url;
          }
          if (rapidData.thumb || rapidData.thumbnail) {
            coverUrl = rapidData.thumb || rapidData.thumbnail;
          }
          if (rapidData.title) {
            title = rapidData.title;
          }
        }
      } catch (err) {
        console.warn('RapidAPI Instagram extraction warning:', err);
      }
    }

    // Try alternative open scraper API if videoUrl wasn't found in HTML or RapidAPI
    if (!videoUrl) {
      try {
        const altRes = await fetch(`https://backend.clipto.com/api/v1/extract?url=${encodeURIComponent(cleanUrl)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.videoUrl || altData.url) {
            videoUrl = altData.videoUrl || altData.url;
          }
          if (altData.title && !title) title = altData.title;
          if (altData.thumbnail && !coverUrl) coverUrl = altData.thumbnail;
        }
      } catch {
        // ignore
      }
    }

    // Local yt-dlp fallback: free, no API key, no quota limits
    if (!videoUrl) {
      const ytInfo = await extractWithYtDlp(cleanUrl);
      if (ytInfo && ytInfo.videoUrl) {
        videoUrl = ytInfo.videoUrl;
        if (!coverUrl && ytInfo.thumbnail) coverUrl = ytInfo.thumbnail;
        if (!title && ytInfo.title) title = ytInfo.title;
      }
    }

    // If still no videoUrl, we cannot deliver the real video - do not substitute a fake video
    if (!videoUrl) {
      throw new Error('Meta (Instagram) ha bloqueado el acceso a este video. La cuenta puede ser privada o requerir inicio de sesión.');
    }

    const shortcodeMatch = cleanUrl.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[2] : 'ig_' + Date.now();
    const finalCover = coverUrl || `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80`;

    return {
      id: shortcode,
      platform: 'instagram' as const,
      originalUrl: url,
      title: title || (oEmbedData?.title ? oEmbedData.title : 'Reel de Instagram'),
      author: {
        name: authorName,
        username: `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
        avatar: undefined,
      },
      thumbnail: finalCover,
      downloadOptions: {
        videoNoWatermark: videoUrl,
        videoHd: videoUrl,
        audio: undefined,
        thumbnail: finalCover,
      },
      stats: {
        likes: undefined,
      },
      isFallback: false,
    };
  } catch (err: any) {
    console.error('Instagram extraction error:', err.message);
    throw err;
  }
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Extract media information
app.post('/api/extract', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'Por favor ingresa un enlace válido.' });
      return;
    }

    const trimmedUrl = url.trim();
    const platform = detectPlatform(trimmedUrl);

    if (platform === 'unknown') {
      res.status(400).json({
        success: false,
        error: 'El enlace no parece ser de TikTok ni de Instagram. Asegúrate de que contenga tiktok.com o instagram.com.',
      });
      return;
    }

    if (platform === 'tiktok') {
      try {
        const data = await extractTikTok(trimmedUrl);
        res.json({ success: true, data });
        return;
      } catch (ttErr: any) {
        // Fallback with helpful error or structured demo
        res.status(422).json({
          success: false,
          error: 'No se pudo obtener el video de TikTok. Verifica que el video sea público y que el enlace esté completo.',
        });
        return;
      }
    }

    if (platform === 'instagram') {
      try {
        const data = await extractInstagram(trimmedUrl);
        res.json({
          success: true,
          data,
          message: data.isFallback
            ? 'Instagram requiere a veces confirmación en su app. Te proveemos la mejor resolución disponible.'
            : undefined
        });
        return;
      } catch (igErr: any) {
        res.status(422).json({
          success: false,
          error: 'No se pudo procesar el enlace de Instagram. Verifica que la cuenta sea pública.',
        });
        return;
      }
    }
  } catch (globalErr: any) {
    console.error('Error in /api/extract:', globalErr);
    res.status(500).json({ success: false, error: 'Ocurrió un error inesperado al procesar el video.' });
  }
});

// Proxy download to force real file download (avoiding CORS, inline play & hotlinking blocks)
app.get('/api/proxy-download', async (req: Request, res: Response) => {
  try {
    const mediaUrl = req.query.url as string;
    const filename = (req.query.filename as string) || 'video.mp4';

    if (!mediaUrl || !mediaUrl.startsWith('http')) {
      res.status(400).send('URL inválida');
      return;
    }

    const headRes = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': mediaUrl.includes('tiktok') ? 'https://www.tiktok.com/' : 'https://www.instagram.com/',
      },
    });

    if (!headRes.ok || !headRes.body) {
      res.status(502).send('Error al obtener el archivo desde el servidor de origen.');
      return;
    }

    const contentType = headRes.headers.get('content-type') || (filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');
    const contentLength = headRes.headers.get('content-length');

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream body to response
    const reader = headRes.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        res.write(value);
      }
    };
    await pump();
  } catch (downloadErr: any) {
    console.error('Proxy download error:', downloadErr.message);
    if (!res.headersSent) {
      res.status(500).send('Error al descargar el archivo.');
    }
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
