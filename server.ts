import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';

const execFileAsync = promisify(execFile);
const YTDLP_BIN = process.env.YTDLP_BIN || path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// Optional Instagram session cookies (Netscape format) to avoid anonymous rate-limits.
// Loaded from local file ig_cookies.txt, or from the IG_COOKIES_TXT env var (Render).
const IG_COOKIES_PATH = path.join(process.cwd(), 'ig_cookies.txt');
if (process.env.IG_COOKIES_TXT) {
  try {
    let raw = process.env.IG_COOKIES_TXT;
    // Allow a base64 single-line value (Render's env input doesn't accept newlines).
    if (!raw.includes('\n') && !raw.includes('\t')) {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      if (decoded.includes('.instagram.com')) raw = decoded;
    }
    fs.writeFileSync(IG_COOKIES_PATH, raw, 'utf8');
    console.log('IG cookies loaded from env.');
  } catch (e: any) {
    console.warn('Could not write IG cookies file:', e.message);
  }
}
function ytDlpCookiesArgs(): string[] {
  if (fs.existsSync(IG_COOKIES_PATH)) {
    return ['--cookies', IG_COOKIES_PATH];
  }
  return [];
}

// Tiny in-memory cache so repeated extracts of the same URL don't hammer Instagram.
const urlCache = new Map<string, { value: string; expires: number }>();
const URL_CACHE_TTL = 1000 * 60 * 20;

function cacheGet(key: string): string | undefined {
  const hit = urlCache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    urlCache.delete(key);
    return undefined;
  }
  return hit.value;
}
function cacheSet(key: string, value: string): void {
  if (urlCache.size > 400) {
    const now = Date.now();
    for (const [k, v] of urlCache) {
      if (now > v.expires) urlCache.delete(k);
    }
  }
  urlCache.set(key, { value, expires: Date.now() + URL_CACHE_TTL });
}

// Run yt-dlp and return stdout/stderr even when the exit code is non-zero
// (Instagram rate-limit etc. makes yt-dlp exit 1 while still printing JSON).
async function runYtDlp(args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  const base = ytDlpCookiesArgs().concat(args);
  const attemptList: string[][] = [
    base,
    ['--extractor-args', 'instagram:api=web'].concat(base),
  ];
  let lastErr: any = null;
  for (const cmdArgs of attemptList) {
    try {
      const out = await execFileAsync(YTDLP_BIN, cmdArgs, { timeout: timeoutMs, windowsHide: true, maxBuffer: 25 * 1024 * 1024 });
      return { stdout: out.stdout || '', stderr: out.stderr || '' };
    } catch (err: any) {
      lastErr = err;
      if (err.stdout) return { stdout: err.stdout, stderr: err.stderr || '' };
    }
  }
  throw lastErr;
}

const app = express();
const PORT = Number(process.env.PORT) || 8040;

app.use(express.json());

// Proxy images from Instagram CDN (the browser can't fetch them directly because
// Instagram blocks requests with a non-instagram.com Referer).
app.get('/api/proxy-image', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ error: 'Missing or invalid url param' });
      return;
    }
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };
    const cookieArgs = ytDlpCookiesArgs();
    if (cookieArgs.length && fs.existsSync(IG_COOKIES_PATH)) {
      const raw = fs.readFileSync(IG_COOKIES_PATH, 'utf8').replace(/\r/g, '');
      const cookieLine = raw.split('\n')
        .filter(l => l && !l.startsWith('#') && l.includes('\t'))
        .map(l => { const p = l.split('\t'); return `${p[5]}=${p[6]}`; })
        .join('; ');
      if (cookieLine) headers['Cookie'] = cookieLine;
    }
    const igRes = await fetch(url, { headers, redirect: 'follow' });
    if (!igRes.ok) {
      res.status(igRes.status).json({ error: `Upstream ${igRes.status}` });
      return;
    }
    const contentType = igRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buf = Buffer.from(await igRes.arrayBuffer());
    res.end(buf);
  } catch (err: any) {
    console.warn('proxy-image failed:', err.message);
    res.status(502).json({ error: 'Proxy fetch failed' });
  }
});

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
    // Try direct HTML scrape first (no external API, works from datacenter IPs)
    try {
      const htmlRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
          const json = JSON.parse(scriptMatch[1]);
          const item = json?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
          if (item?.video) {
            const playAddr = item.video.playAddr?.find?.((p: any) => p.quality ?? 0) || item.video.playAddr?.[0];
            const videoUrl = playAddr?.src?.startsWith('http') ? playAddr.src : item.video.downloadAddr;
            if (videoUrl) {
              const coverUrl = item.video.cover?.startsWith('http') ? item.video.cover : item.video.dynamicCover;
              const musicUrl = item.music?.playUrl?.startsWith('http') ? item.music.playUrl : undefined;
              return {
                id: item.id || `tt_${Date.now()}`,
                platform: 'tiktok' as const,
                originalUrl: url,
                title: item.desc || 'Video de TikTok',
                author: {
                  name: item.author?.nickname || 'TikTok Creator',
                  username: item.author?.uniqueId ? `@${item.author.uniqueId}` : '@tiktok',
                  avatar: item.author?.avatarThumb,
                },
                thumbnail: coverUrl,
                duration: item.video.duration || 0,
                downloadOptions: {
                  videoNoWatermark: videoUrl,
                  videoHd: videoUrl,
                  audio: musicUrl,
                  thumbnail: coverUrl,
                },
                stats: {
                  likes: formatStat(item.stats?.diggCount),
                  views: formatStat(item.stats?.playCount),
                  shares: formatStat(item.stats?.shareCount),
                  comments: formatStat(item.stats?.commentCount),
                },
                createdAt: item.createTime ? new Date(item.createTime * 1000).toISOString() : undefined,
              };
            }
          }
        }
      }
    } catch {
      // fall through to TikWM below
    }

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
  const cacheKey = `single:${url}`;
  const cached = cacheGet(cacheKey);
  const raw = cached || await (async () => {
    let stdout = '';
    let stderr = '';
    try {
      const out = await runYtDlp(['--no-warnings', '--no-playlist', '-J', url], 60000);
      stdout = out.stdout;
      stderr = out.stderr;
    } catch (err: any) {
      console.warn('yt-dlp extraction failed:', err.message);
      return null;
    }
    cacheSet(cacheKey, `${stdout}\n@RATE@\n${stderr}`);
    return `${stdout}\n@RATE@\n${stderr}`;
  })();

  if (!raw) return null;
  try {
    const info = JSON.parse(raw.split('\n@RATE@\n')[0]);
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
    console.warn('yt-dlp extraction parse failed:', err.message);
    return null;
  }
}

// yt-dlp carousel/album extraction: returns all slides/posts (images + videos)
// Note: yt-dlp only exposes VIDEO slides in stdout. Image slides are printed as
// "ERROR: [Instagram] <id>: No video formats found!" in stderr, so we recover the
// image slide IDs from stderr and rebuild each image URL via the classic
// https://www.instagram.com/p/<id>/media/?size=l endpoint.
async function extractCarouselWithYtDlp(url: string) {
  const cacheKey = `carousel:${url}`;
  const cached = cacheGet(cacheKey);

  let stdout = '';
  let stderr = '';
  if (cached) {
    const parts = cached.split('\n@RATE@\n');
    stdout = parts[0] || '';
    stderr = parts[1] || '';
  } else {
    try {
      const out = await runYtDlp(['--no-warnings', '-J', url], 90000);
      stdout = out.stdout;
      stderr = out.stderr;
    } catch (err: any) {
      // yt-dlp exits non-zero when some slides fail, but still prints the full
      // playlist JSON to stdout.
      console.warn('yt-dlp carousel extraction failed:', err.message);
      return null;
    }
    if (!stdout) return null;
    cacheSet(cacheKey, `${stdout}\n@RATE@\n${stderr}`);
  }

  try {
    const info = JSON.parse(stdout);

    // A carousel in yt-dlp appears as a playlist with multiple entries
    const entries: any[] =
      info._type === 'playlist' && Array.isArray(info.entries) ? info.entries : [];
    if (entries.length <= 1) return null;

    // Recover image slide ids from yt-dlp stderr, in the order they fail
    const imageIds: string[] = [];
    const stderrStr = String(stderr || '');
    const idRe = /\[Instagram\]\s+([A-Za-z0-9_-]+):\s*(?:No video formats found|There is no video)/gi;
    let m: RegExpExecArray | null;
    while ((m = idRe.exec(stderrStr)) !== null) {
      if (!imageIds.includes(m[1])) imageIds.push(m[1]);
    }

    let imgIdx = 0;
    const items: any[] = [];
    entries.forEach((entry: any, index: number) => {
      let slide = entry && !entry._type ? entry : null;
      if (slide) {
        let url = slide.url || '';
        if (url && !url.startsWith('http')) url = '';
        if (!url && Array.isArray(slide.formats)) {
          const f = [...slide.formats].reverse().find((x: any) => x.url && String(x.url).startsWith('http'));
          url = f?.url || '';
        }
        if (!url) {
          slide = null;
        }
      }
      if (!slide) {
        // Image slide: build direct image URL from its recovered id
        const slideId = imageIds[imgIdx] || (entries as any[])[index]?.id;
        imgIdx++;
        if (slideId) {
          items.push({
            url: `https://www.instagram.com/p/${slideId}/media/?size=l`,
            title: `${slideId}.jpg`,
            thumbnail: `https://www.instagram.com/p/${slideId}/media/?size=l`,
            isVideo: false,
          });
        }
        return;
      }
      const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(slide.url || '') || slide.vcodec !== 'none' || slide.ext === 'mp4';
      const ext = isVideo ? 'mp4' : 'jpg';
      items.push({
        url: slide.url,
        title: `${slide.id || index + 1}.${ext}`,
        thumbnail: typeof slide.thumbnail === 'string' && slide.thumbnail.startsWith('http') ? slide.thumbnail : slide.url,
        isVideo,
      });
    });

    const validItems = items.filter(Boolean);
    if (validItems.length <= 1) return null;
    return {
      entries: validItems,
      title: typeof info.title === 'string' ? info.title : undefined,
      thumbnail: typeof info.thumbnail === 'string' && info.thumbnail.startsWith('http') ? info.thumbnail : validItems[0].thumbnail,
    };
  } catch (err: any) {
    console.warn('yt-dlp carousel extraction failed:', err.message);
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

    // Try carousel/album extraction (multi-slide Instagram posts)
    let carouselEntries: any[] | undefined = undefined;
    const carouselInfo = await extractCarouselWithYtDlp(cleanUrl);
    if (carouselInfo && carouselInfo.entries.length > 1) {
      carouselEntries = carouselInfo.entries;
      if (!title && carouselInfo.title) title = carouselInfo.title;
      if (!coverUrl && carouselInfo.thumbnail) coverUrl = carouselInfo.thumbnail;
    }

    // If still no videoUrl, we cannot deliver the real video - do not substitute a fake video
    if (!videoUrl && !carouselEntries) {
      throw new Error('Meta (Instagram) ha bloqueado el acceso a este video. La cuenta puede ser privada o requerir inicio de sesión.');
    }

    const shortcodeMatch = cleanUrl.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[2] : 'ig_' + Date.now();
    const finalCover = coverUrl || (carouselEntries?.[0]?.thumbnail) || `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80`;
    const mainVideoUrl = videoUrl || (carouselEntries?.[0]?.url);

    return {
      id: shortcode,
      platform: 'instagram' as const,
      originalUrl: url,
      title: title || (oEmbedData?.title ? oEmbedData.title : carouselEntries ? 'Álbum de Instagram' : 'Reel de Instagram'),
      author: {
        name: authorName,
        username: `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
        avatar: undefined,
      },
      thumbnail: finalCover,
      downloadOptions: {
        videoNoWatermark: mainVideoUrl,
        videoHd: mainVideoUrl,
        audio: undefined,
        thumbnail: finalCover,
      },
      carousel: carouselEntries,
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
        console.error('TikTok fallback (tikwm+html) failed:', ttErr.message);
        // Last resort: try yt-dlp
        try {
          const yd = await extractWithYtDlp(trimmedUrl);
          if (yd?.videoUrl) {
            res.json({
              success: true,
              data: {
                id: `tt_${Date.now()}`,
                platform: 'tiktok',
                originalUrl: trimmedUrl,
                title: yd.title || 'Video de TikTok',
                author: { name: 'TikTok Creator', username: '@tiktok' },
                thumbnail: yd.thumbnail,
                duration: yd.duration || 0,
                downloadOptions: {
                  videoNoWatermark: yd.videoUrl,
                  videoHd: yd.videoUrl,
                  thumbnail: yd.thumbnail,
                },
              },
            });
            return;
          }
        } catch (ydErr: any) {
          console.error('TikTok yt-dlp fallback failed:', ydErr.message);
        }
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

// Google Drive helpers
async function googleFindFolder(accessToken: string, folderName: string, parentId?: string): Promise<string | null> {
  const q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
    (parentId ? ` and '${parentId}' in parents` : ` and 'root' in parents`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function googleCreateFolder(accessToken: string, folderName: string, parentId?: string): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id || null;
}

async function googleResolveFolder(accessToken: string, folderName: string, parentId?: string): Promise<string | null> {
  const existing = await googleFindFolder(accessToken, folderName, parentId);
  if (existing) return existing;
  return googleCreateFolder(accessToken, folderName, parentId);
}

async function googleUploadBuffer(
  accessToken: string,
  buffer: Buffer,
  filename: string,
  mimeType: string,
  parentId?: string
): Promise<{ id?: string; webViewLink?: string } | null> {
  const metadataBody = JSON.stringify({
    name: filename,
    mimeType,
    ...(parentId ? { parents: [parentId] } : {}),
  });

  const sessionRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(buffer.length),
      },
      body: metadataBody,
    }
  );

  if (!sessionRes.ok) return null;

  const uploadUri = sessionRes.headers.get('location');
  if (!uploadUri) return null;

  const uploadRes = await fetch(uploadUri, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: buffer,
  });

  if (!uploadRes.ok) return null;
  const fileData = await uploadRes.json();
  return {
    id: fileData.id,
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
  };
}

async function googleDownloadMedia(videoUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const mediaRes = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': videoUrl.includes('tiktok') ? 'https://www.tiktok.com/' : 'https://www.instagram.com/',
      },
    });
    if (!mediaRes.ok || !mediaRes.body) return null;
    const buffer = Buffer.from(await mediaRes.arrayBuffer());
    const contentType = mediaRes.headers.get('content-type') || 'video/mp4';
    return { buffer, contentType };
  } catch {
    return null;
  }
}

// Google Drive: download video from source URL and upload it to the user's Drive
app.post('/api/drive/upload', async (req: Request, res: Response) => {
  try {
    const { accessToken, videoUrl, filename, mimeType } = req.body;
    if (!accessToken || !videoUrl || !filename) {
      res.status(400).json({ success: false, error: 'Faltan datos para guardar en Google Drive.' });
      return;
    }

    // 1. Download the video bytes from the source (streaming)
    const media = await googleDownloadMedia(videoUrl);
    if (!media) {
      res.status(502).json({ success: false, error: 'No se pudo descargar el video desde el servidor de origen.' });
      return;
    }

    const contentType = mimeType || media.contentType || 'video/mp4';
    const safeFilename = filename.replace(/[^\w\-.]/g, '_').slice(-80);

    const FOLDER_NAME = process.env.DRIVE_FOLDER_NAME || 'Esquina Baja';

    // 2a. Find (or create) the target folder in the user's Drive
    const folderId = await googleResolveFolder(accessToken, FOLDER_NAME) || 'root';

    // 2b. Create an empty file in Drive via resumable upload session
    const uploaded = await googleUploadBuffer(accessToken, media.buffer, safeFilename, contentType, folderId);
    if (!uploaded) {
      res.status(401).json({
        success: false,
        error: 'Google rechazó la sesión. Tu sesión de Google pudo expirar.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        fileId: uploaded.id,
        name: safeFilename,
        mimeType: contentType,
        folderId,
        folderName: FOLDER_NAME,
        webViewLink: uploaded.webViewLink,
      },
    });
  } catch (driveErr: any) {
    console.error('Google Drive upload error:', driveErr.message);
    res.status(500).json({ success: false, error: 'Ocurrió un error al guardar en Google Drive.' });
  }
});

// Google Drive: upload a whole carousel/album into a dedicated subfolder
app.post('/api/drive/upload-album', async (req: Request, res: Response) => {
  try {
    const { accessToken, albumName, files } = req.body;
    if (!accessToken || !albumName || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ success: false, error: 'Faltan datos para guardar el álbum en Google Drive.' });
      return;
    }

    const FOLDER_NAME = process.env.DRIVE_FOLDER_NAME || 'Esquina Baja';
    const rootFolderId = await googleResolveFolder(accessToken, FOLDER_NAME) || 'root';

    // Create a subfolder for this album (sanitized name)
    const safeAlbumName = String(albumName).replace(/[^\w\- ]/g, '').slice(0, 60) || 'Álbum de Instagram';
    const albumFolderId = await googleResolveFolder(accessToken, safeAlbumName, rootFolderId) || rootFolderId;

    let erroredCount = 0;
    let uploadedCount = 0;

    for (const file of files) {
      if (!file || !file.videoUrl) continue;
      const media = await googleDownloadMedia(file.videoUrl);
      if (!media) {
        erroredCount++;
        continue;
      }
      const mimeType = file.mimeType || media.contentType || 'video/mp4';
      const safeFilename = String(file.filename || `slide_${uploadedCount + 1}.jpg`)
        .replace(/[^\w\-.]/g, '_')
        .slice(-80);
      const uploaded = await googleUploadBuffer(accessToken, media.buffer, safeFilename, mimeType, albumFolderId);
      if (uploaded) uploadedCount++;
      else erroredCount++;
    }

    res.json({
      success: uploadedCount > 0,
      data: {
        uploadedCount,
        erroredCount,
        albumName: safeAlbumName,
        folderName: FOLDER_NAME,
        folderLink: `https://drive.google.com/drive/folders/${albumFolderId}`,
      },
    });
  } catch (driveErr: any) {
    console.error('Google Drive album upload error:', driveErr.message);
    res.status(500).json({ success: false, error: 'Ocurrió un error al guardar el álbum en Google Drive.' });
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
