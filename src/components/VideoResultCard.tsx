import { useState } from 'react';
import {
  Download,
  Music,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Heart,
  Eye,
  Share2,
  Clock,
  Cloud,
  ExternalLink as DriveLink,
} from 'lucide-react';
import { VideoMediaInfo, DownloadHistoryItem } from '../types';
import { downloadFileUniversal } from '../services/clientExtractor';
import { signInToGoogleAndUpload, signInToGoogleAndUploadAlbum } from '../services/googleDrive';
import { API_BASE_URL } from '../config';

// Instagram blocks <img> requests that carry a foreign Referer. Route those
// through the backend proxy so the images render in the browser.
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https:\/\/(www\.)?instagram\.com\/p\/[^?]+\/media\//.test(url)) {
    return `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

interface VideoResultCardProps {
  media: VideoMediaInfo;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onAddHistory: (item: DownloadHistoryItem) => void;
}

export function VideoResultCard({ media, onToast, onAddHistory }: VideoResultCardProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [isDownloadingThumb, setIsDownloadingThumb] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<string | undefined>(undefined);

  const cleanFilename = (base: string, ext: string) => {
    const slug = (media.title || 'video')
      .slice(0, 35)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${media.platform}_${slug}_${Date.now()}.${ext}`;
  };

  const handleDownload = async (
    url: string | undefined,
    type: 'video' | 'audio' | 'thumbnail',
    ext: string
  ) => {
    if (!url) {
      onToast('error', 'Este formato no está disponible para este video.');
      return;
    }

    const filename = cleanFilename(type, ext);

    if (type === 'video') setIsDownloadingVideo(true);
    if (type === 'audio') setIsDownloadingAudio(true);
    if (type === 'thumbnail') setIsDownloadingThumb(false);

    onToast(
      'info',
      `Iniciando descarga de ${
        type === 'video' ? 'Video MP4' : type === 'audio' ? 'Audio MP3' : 'Miniatura'
      }...`
    );

    try {
      await downloadFileUniversal(url, filename);

      // Save to history
      onAddHistory({
        id: `${media.id}_${type}_${Date.now()}`,
        platform: media.platform,
        title: media.title || 'Video descargado',
        thumbnail: media.thumbnail,
        author: media.author.username || media.author.name,
        downloadDate: Date.now(),
        downloadUrl: url,
        mediaType: type === 'thumbnail' ? 'image' : type,
      });

      setTimeout(() => {
        onToast('success', 'Descarga iniciada con éxito.');
      }, 1000);
    } catch (err: any) {
      console.error('Download error:', err);
      onToast('error', err?.message || 'No se pudo descargar el archivo.');
    } finally {
      if (type === 'video') setIsDownloadingVideo(false);
      if (type === 'audio') setIsDownloadingAudio(false);
      if (type === 'thumbnail') setIsDownloadingThumb(false);
    }
  };

  const handleCopyCaption = async () => {
    if (!media.title) return;
    try {
      await navigator.clipboard.writeText(media.title);
      setCopiedCaption(true);
      onToast('success', 'Descripción y hashtags copiados');
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      onToast('error', 'No se pudo copiar el texto.');
    }
  };

  const handleCopyDirectLink = async () => {
    const directUrl =
      media.downloadOptions.videoHd || media.downloadOptions.videoNoWatermark || media.originalUrl;
    try {
      await navigator.clipboard.writeText(directUrl);
      onToast('success', 'Enlace directo copiado');
    } catch {
      onToast('error', 'No se pudo copiar el enlace.');
    }
  };

  const handleSaveToDrive = async () => {
    // Carousel: save all slides to a dedicated subfolder
    if (media.carousel && media.carousel.length > 0) {
      setIsSavingToDrive(true);
      setDriveError(null);
      setDriveLink(null);
      onToast('info', 'Iniciando sesión con Google para guardar el álbum...');

      const albumName = `${media.platform}_${(media.title || 'album').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35)}`;
      const files = media.carousel.map((slide, idx) => ({
        videoUrl: slide.url,
        filename: `${albumName}_${idx + 1}.${slide.isVideo ? 'mp4' : 'jpg'}`,
        mimeType: slide.isVideo ? 'video/mp4' : 'image/jpeg',
      }));

      const result = await signInToGoogleAndUploadAlbum({
        albumName,
        files,
      });

      setIsSavingToDrive(false);
      if (result.ok && result.webViewLink) {
        const folderName = result.folderName ? ` en "${result.folderName}"` : '';
        setDriveLink(result.webViewLink);
        onToast('success', `Álbum guardado en tu Google Drive${folderName}`);
      } else {
        setDriveError(result.error || 'No se pudo guardar el álbum en Google Drive.');
        onToast('error', result.error || 'No se pudo guardar el álbum en Google Drive.');
      }
      return;
    }

    const videoUrl = media.downloadOptions.videoHd || media.downloadOptions.videoNoWatermark;
    if (!videoUrl) {
      onToast('error', 'El video no tiene una URL de descarga disponible.');
      return;
    }

    setIsSavingToDrive(true);
    setDriveError(null);
    setDriveLink(null);
    onToast('info', 'Iniciando sesión con Google para guardar en Drive...');

    const result = await signInToGoogleAndUpload({
      videoUrl,
      filename: cleanFilename('video', 'mp4'),
      mimeType: 'video/mp4',
    });

    setIsSavingToDrive(false);
    if (result.ok && result.webViewLink) {
      const folderName = result.folderName ? ` en "${result.folderName}"` : '';
      setDriveLink(result.webViewLink);
      onToast('success', `Guardado en tu Google Drive${folderName}`);
    } else {
      setDriveError(result.error || 'No se pudo guardar en Google Drive.');
      onToast('error', result.error || 'No se pudo guardar en Google Drive.');
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div
      id="video-result-card"
      className="w-full max-w-3xl mx-auto px-3 sm:px-4 my-4 sm:my-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl shadow-neutral-200/50 dark:shadow-2xl backdrop-blur-xl transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Media preview column (5 cols on md) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
          {media.carousel && media.carousel.length > 0 ? (
            // Carousel gallery preview
            <div className="w-full max-w-[280px] sm:max-w-none mx-auto flex flex-col items-center">
              <div className="relative w-full max-w-[280px] sm:max-w-none aspect-square rounded-2xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 shadow-inner flex items-center justify-center">
                {(() => {
                  const active = media.carousel[0];
                  return active.isVideo ? (
                    <video
                      src={active.url}
                      poster={resolveImageUrl(active.thumbnail)}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={resolveImageUrl(selectedSlide || active.thumbnail)}
                      alt={media.title}
                      className="w-full h-full object-contain bg-black"
                    />
                  );
                })()}
              </div>

              {/* Slide thumbnails strip */}
              <div className="mt-2 w-full flex gap-1.5 overflow-x-auto pb-1">
                {media.carousel.map((slide, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                      (selectedSlide || media.carousel[0].thumbnail) === slide.thumbnail && !slide.isVideo
                        ? 'border-blue-500 ring-1 ring-blue-500/40'
                        : 'border-neutral-200 dark:border-neutral-700 opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => {
                      setSelectedSlide(slide.thumbnail);
                      if (slide.isVideo) {
                        const activeEl = document.getElementById('media-player');
                        if (activeEl) activeEl.removeAttribute('src');
                      }
                    }}
                  >
                    <img src={resolveImageUrl(slide.thumbnail)} alt="" className="w-full h-full object-cover" />
                    {slide.isVideo && (
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] bg-black/70 text-white px-1 rounded leading-none">
                        MP4
                      </span>
                    )}
                    <span className="absolute top-0.5 left-0.5 text-[7px] bg-black/70 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 text-center">
                Álbum de Instagram — {media.carousel.length} {media.carousel.length === 1 ? 'diapositiva' : 'diapositivas'}
              </p>
            </div>
          ) : (
            <div className="relative w-full max-w-[280px] sm:max-w-none mx-auto aspect-[9/16] max-h-[380px] sm:max-h-[420px] rounded-2xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 shadow-inner flex items-center justify-center">
              {media.downloadOptions.videoNoWatermark || media.downloadOptions.videoHd ? (
                <video
                  id="media-player"
                  src={media.downloadOptions.videoHd || media.downloadOptions.videoNoWatermark}
                  poster={media.thumbnail}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img
                  src={media.thumbnail}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Platform badge on player */}
              <div className="absolute top-2.5 left-2.5 pointer-events-none">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold shadow-md backdrop-blur-md ${
                    media.platform === 'tiktok'
                      ? 'bg-white/90 dark:bg-neutral-900/80 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                      : media.platform === 'facebook'
                        ? 'bg-white/90 dark:bg-neutral-900/80 border border-blue-500/40 text-blue-700 dark:text-blue-300'
                        : 'bg-white/90 dark:bg-neutral-900/80 border border-pink-500/40 text-pink-700 dark:text-pink-300'
                  }`}
                >
                  {media.platform === 'tiktok' ? 'TikTok' : media.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                </span>
              </div>
            </div>
          )}

            {/* Duration pill if available */}
            {media.duration ? (
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>Duración: {Math.floor(media.duration)}s</span>
              </div>
            ) : null}
          </div>

          {/* Details & Download Options column (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              {/* Creator header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {media.author.avatar ? (
                    <img
                      src={media.author.avatar}
                      alt={media.author.name}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 shrink-0">
                      {media.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate transition-colors">
                      {media.author.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate transition-colors">
                      {media.author.username}
                    </p>
                  </div>
                </div>

                <a
                  href={media.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0 touch-manipulation"
                  title="Abrir publicación original"
                  aria-label="Abrir enlace original"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Title / Description */}
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Descripción
                  </span>
                  {media.title && (
                    <button
                      type="button"
                      id="btn-copy-caption"
                      onClick={handleCopyCaption}
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors touch-manipulation"
                    >
                      {copiedCaption ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar texto</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-300 line-clamp-3 bg-neutral-50 dark:bg-neutral-950/60 p-2.5 sm:p-3 rounded-xl border border-neutral-200 dark:border-neutral-800/60 leading-relaxed break-words transition-colors">
                  {media.title || 'Sin descripción disponible'}
                </p>
              </div>

              {/* Stats badges */}
              {media.stats && (media.stats.likes || media.stats.views || media.stats.shares) ? (
                <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {media.stats.views ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 transition-colors">
                      <Eye className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                      <span>{formatNumber(media.stats.views)}</span>
                    </div>
                  ) : null}
                  {media.stats.likes ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 transition-colors">
                      <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                      <span>{formatNumber(media.stats.likes)}</span>
                    </div>
                  ) : null}
                  {media.stats.shares ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 transition-colors">
                      <Share2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>{formatNumber(media.stats.shares)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Download Buttons Section */}
            <div className="mt-5 sm:mt-6 flex flex-col gap-2 sm:gap-2.5">
              <span className="text-[11px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Opciones de Descarga
              </span>

              {/* 1. Primary: Video HD MP4 */}
              <button
                type="button"
                id="btn-download-video-hd"
                disabled={isDownloadingVideo}
                onClick={() =>
                  handleDownload(
                    media.downloadOptions.videoHd || media.downloadOptions.videoNoWatermark,
                    'video',
                    'mp4'
                  )
                }
                className="w-full flex items-center justify-between px-3.5 sm:px-4 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">Descargar Video (HD sin marca)</span>
                    <span className="hidden sm:inline">Descargar Video MP4 (HD sin marca)</span>
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-0.5 rounded-md font-bold shrink-0">
                  MP4
                </span>
              </button>

              {/* Secondary options grid */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                {/* 2. Audio MP3 */}
                <button
                  type="button"
                  id="btn-download-audio"
                  disabled={isDownloadingAudio}
                  onClick={() =>
                    handleDownload(
                      media.downloadOptions.audio || media.downloadOptions.videoNoWatermark,
                      'audio',
                      'mp3'
                    )
                  }
                  className="flex items-center justify-between px-3 sm:px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 font-medium text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-50 touch-manipulation min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
                    <span className="truncate">Solo Audio</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 font-bold shrink-0">
                    MP3
                  </span>
                </button>

                {/* 3. Cover / Thumbnail */}
                <button
                  type="button"
                  id="btn-download-thumb"
                  disabled={isDownloadingThumb}
                  onClick={() => handleDownload(media.thumbnail, 'thumbnail', 'jpg')}
                  className="flex items-center justify-between px-3 sm:px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 font-medium text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-50 touch-manipulation min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">Miniatura HD</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 font-bold shrink-0">
                    JPG
                  </span>
                </button>
              </div>

              {/* Utility row: Copy direct URL & Note */}
              <div className="flex flex-col min-[480px]:flex-row items-center justify-between gap-1 pt-1 text-[11px] sm:text-xs text-neutral-500 text-center min-[480px]:text-left">
                <button
                  type="button"
                  id="btn-copy-direct-link"
                  onClick={handleCopyDirectLink}
                  className="hover:text-neutral-800 dark:hover:text-neutral-300 underline underline-offset-2 transition-colors touch-manipulation"
                >
                  Copiar enlace directo al archivo
                </button>
                <span>Descarga libre y sin límites</span>
              </div>

              {/* Google Drive Save */}
              <div className="mt-1 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
                <button
                  type="button"
                  id="btn-save-to-drive"
                  disabled={isSavingToDrive}
                  onClick={handleSaveToDrive}
                  className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-950/20 active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation min-h-[44px]"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                    <Cloud className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {isSavingToDrive
                        ? 'Guardando en Google Drive...'
                        : media.carousel && media.carousel.length > 0
                          ? 'Guardar todo (álbum) en Google Drive'
                          : 'Guardar en Google Drive'}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-0.5 rounded-md font-bold shrink-0">
                    DRIVE
                  </span>
                </button>

                {driveLink && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="drive-link-success"
                    className="mt-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-semibold hover:underline transition-colors"
                  >
                    <DriveLink className="w-4 h-4 shrink-0" />
                    Ver archivo en tu Google Drive
                  </a>
                )}

                {driveError && (
                  <p className="mt-2 text-[11px] sm:text-xs text-red-600 dark:text-red-400 text-center">
                    {driveError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
