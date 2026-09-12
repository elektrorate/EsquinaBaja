const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health Check
app.get(["/health", "/api/health"], (req, res) => {
  res.json({ status: "ok", service: "Firebase Cloud Functions - EsquinaBaja", timestamp: new Date().toISOString() });
});

// Platform detection
function detectPlatform(urlStr) {
  const lower = urlStr.toLowerCase();
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "instagram";
  return "unknown";
}

// 1. TikTok extraction
async function extractTikTok(url) {
  let targetUrl = url.trim();
  const videoIdMatch = targetUrl.match(/\/video\/(\d+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    targetUrl = `https://www.tiktok.com/@user/video/${videoIdMatch[1]}`;
  }

  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}&hd=1`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Error en servidor de TikTok (${response.status})`);
  }

  const data = await response.json();
  if (data.code === 0 && data.data) {
    const item = data.data;
    const baseDomain = "https://www.tikwm.com";
    const playUrl = item.play?.startsWith("http") ? item.play : `${baseDomain}${item.play}`;
    const hdPlayUrl = item.hdplay ? (item.hdplay.startsWith("http") ? item.hdplay : `${baseDomain}${item.hdplay}`) : playUrl;
    const musicUrl = item.music ? (item.music.startsWith("http") ? item.music : `${baseDomain}${item.music}`) : undefined;
    const coverUrl = item.cover?.startsWith("http") ? item.cover : `${baseDomain}${item.cover}`;

    return {
      id: item.id || `tt_${Date.now()}`,
      platform: "tiktok",
      originalUrl: url,
      title: item.title || "Video de TikTok sin marca de agua",
      author: {
        name: item.author?.nickname || item.author?.unique_id || "TikTok Creator",
        username: item.author?.unique_id ? `@${item.author.unique_id}` : "@tiktok",
        avatar: item.author?.avatar?.startsWith("http") ? item.author.avatar : (item.author?.avatar ? `${baseDomain}${item.author.avatar}` : undefined),
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
  }

  throw new Error(data.msg || "No se pudo obtener el video de TikTok. Asegúrate de que sea público.");
}

// 2. Instagram extraction
async function extractInstagram(url) {
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");

  // Metadata via oEmbed
  let oEmbedData = null;
  try {
    const oEmbedRes = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (oEmbedRes.ok) {
      oEmbedData = await oEmbedRes.json();
    }
  } catch {
    // ignore oembed error
  }

  let videoUrl = "";
  let coverUrl = oEmbedData?.thumbnail_url || "";
  let title = oEmbedData?.title || "";
  let authorName = oEmbedData?.author_name || "Instagram User";

  // RapidAPI check (if secret/env is configured)
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (rapidApiKey) {
    try {
      const rapidRes = await fetch("https://instagram-video-downloader13.p.rapidapi.com/index.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "instagram-video-downloader13.p.rapidapi.com",
        },
        body: JSON.stringify({ url: cleanUrl }),
      });
      if (rapidRes.ok) {
        const rapidData = await rapidRes.json();
        if (rapidData.url || rapidData.video_url || rapidData.download_url) {
          videoUrl = rapidData.url || rapidData.video_url || rapidData.download_url;
        }
        if (rapidData.thumb || rapidData.thumbnail) {
          coverUrl = rapidData.thumb || rapidData.thumbnail;
        }
        if (rapidData.title) title = rapidData.title;
      }
    } catch (e) {
      console.warn("RapidAPI warning in Cloud Function:", e);
    }
  }

  // Direct HTML / og:video extraction from Server
  if (!videoUrl) {
    try {
      const htmlRes = await fetch(cleanUrl + "/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const videoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);
        if (videoMatch && videoMatch[1]) {
          videoUrl = videoMatch[1].replace(/&amp;/g, "&");
        }

        if (!coverUrl) {
          const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
          if (imgMatch && imgMatch[1]) {
            coverUrl = imgMatch[1].replace(/&amp;/g, "&");
          }
        }
      }
    } catch (e) {
      console.warn("HTML extraction warning in Cloud Function:", e);
    }
  }

  if (!videoUrl) {
    throw new Error("Meta (Instagram) ha bloqueado el acceso a este video. La cuenta puede ser privada o requerir inicio de sesión.");
  }

  const shortcodeMatch = cleanUrl.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[2] : "ig_" + Date.now();
  const finalCover = coverUrl || `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80`;

  return {
    id: shortcode,
    platform: "instagram",
    originalUrl: url,
    title: title || `Reel de Instagram (@${authorName})`,
    author: {
      name: authorName,
      username: `@${authorName.toLowerCase().replace(/\s+/g, "_")}`,
    },
    thumbnail: finalCover,
    duration: 0,
    downloadOptions: {
      videoNoWatermark: videoUrl,
      videoHd: videoUrl,
      thumbnail: finalCover,
    },
    stats: {
      likes: 0,
      views: 0,
      shares: 0,
      comments: 0,
    },
  };
}

// Handler for media extraction
async function handleExtract(req, res) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "Por favor ingresa un enlace válido." });
    }

    const platform = detectPlatform(url.trim());
    if (platform === "unknown") {
      return res.status(400).json({
        success: false,
        error: "El enlace no parece ser de TikTok ni de Instagram.",
      });
    }

    if (platform === "tiktok") {
      const data = await extractTikTok(url.trim());
      return res.json({ success: true, data });
    }

    if (platform === "instagram") {
      const data = await extractInstagram(url.trim());
      return res.json({ success: true, data });
    }
  } catch (err) {
    return res.status(422).json({ success: false, error: err.message || "Error al procesar el enlace." });
  }
}

// Support both /api/extract and /extract (for Firebase rewrites)
app.post("/extract", handleExtract);
app.post("/api/extract", handleExtract);

// Proxy download handler
async function handleProxyDownload(req, res) {
  try {
    const mediaUrl = req.query.url;
    const filename = req.query.filename || "video.mp4";

    if (!mediaUrl || !mediaUrl.startsWith("http")) {
      return res.status(400).send("URL inválida");
    }

    const headRes = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": mediaUrl.includes("tiktok") ? "https://www.tiktok.com/" : "https://www.instagram.com/",
      },
    });

    if (!headRes.ok || !headRes.body) {
      return res.status(502).send("Error al obtener el archivo del servidor de origen.");
    }

    const contentType = headRes.headers.get("content-type") || (filename.endsWith(".mp3") ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    
    // Pipe buffer to response
    const arrayBuffer = await headRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    return res.status(500).send("Error al descargar el archivo: " + e.message);
  }
}

app.get("/proxy-download", handleProxyDownload);
app.get("/api/proxy-download", handleProxyDownload);

// Export Cloud Function
exports.api = functions.https.onRequest(app);
