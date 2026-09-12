import { VideoMediaInfo } from '../types';

export function detectPlatform(urlStr: string): 'tiktok' | 'instagram' | 'unknown' {
  const lower = urlStr.toLowerCase().trim();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  return 'unknown';
}

/**
 * Extracts TikTok media directly in the browser using public CORS-enabled endpoint.
 */
async function extractTikTokClient(url: string): Promise<VideoMediaInfo> {
  // Clean TikTok URL: If it has /video/{id}, extract clean canonical URL to prevent parsing failures from tracking queries
  let targetUrl = url.trim();
  const videoIdMatch = targetUrl.match(/\/video\/(\d+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    targetUrl = `https://www.tiktok.com/@user/video/${videoIdMatch[1]}`;
  }

  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}&hd=1`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error en servidor de TikTok (Código ${response.status})`);
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
      platform: 'tiktok',
      originalUrl: url,
      title: item.title || 'Video de TikTok sin marca de agua',
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
        likes: item.digg_count,
        views: item.play_count,
        shares: item.share_count,
        comments: item.comment_count,
      },
      createdAt: item.create_time ? new Date(item.create_time * 1000).toISOString() : undefined,
    };
  } else {
    if (url.includes('/t/') || url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
      throw new Error('Los enlaces acortados de TikTok (vt.tiktok.com o /t/) no siempre exponen el video directo. Por favor abre el video en tu navegador y copia el enlace completo que contiene /video/...');
    }
    throw new Error(data.msg || 'No se pudo obtener el video de TikTok. Asegúrate de que el video sea público.');
  }
}

/**
 * Extracts Instagram media or explains why client-only extraction is restricted.
 */
async function extractInstagramClient(url: string): Promise<VideoMediaInfo> {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  const shortcodeMatch = cleanUrl.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);

  if (!shortcodeMatch) {
    throw new Error('Enlace de Instagram no válido. Debe ser un Reel o Video (ej: https://www.instagram.com/reel/...).');
  }

  throw new Error(
    'En esta versión desplegada en GitHub Pages, Meta (Instagram) bloquea la extracción directa desde el navegador por políticas CORS. ¡Los enlaces de TikTok sí se procesan y descargan al instante en MP4 sin marca de agua!'
  );
}

/**
 * Master client-side extractor that works anywhere without needing a backend server (perfect for GitHub Pages).
 */
export async function extractMediaClient(url: string): Promise<VideoMediaInfo> {
  const platform = detectPlatform(url);

  if (platform === 'tiktok') {
    return await extractTikTokClient(url);
  } else if (platform === 'instagram') {
    return await extractInstagramClient(url);
  } else {
    throw new Error('Plataforma no soportada. Solo enlaces de TikTok o Instagram.');
  }
}

/**
 * Universal browser-based file downloader.
 * Compatible with GitHub Pages (works without /api/proxy-download).
 */
export async function downloadFileUniversal(url: string, filename: string): Promise<boolean> {
  // 1. Try Blob download (creates genuine file download on device)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      // Verify the returned blob is media and not an AccessDenied XML error
      if (blob.type.includes('xml') || blob.type.includes('html')) {
        const text = await blob.text();
        if (text.includes('<Error>') || text.includes('AccessDenied')) {
          throw new Error('El enlace de descarga directo expiró o requiere autenticación de la plataforma.');
        }
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 300);
      return true;
    }
  } catch (err: any) {
    console.warn('Direct blob download error:', err);
    if (err?.message && err.message.includes('autenticación')) {
      throw err;
    }
  }

  // 2. If running on a fullstack server (not static host like GitHub Pages), try backend proxy:
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  if (!isGitHubPages) {
    try {
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 300);
      return true;
    } catch {
      // fallback
    }
  }

  // 3. Fallback: Direct download trigger
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 300);

  return true;
}
