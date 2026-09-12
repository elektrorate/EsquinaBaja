import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Play, AlertCircle } from 'lucide-react';
import { Platform } from '../types';

interface UrlInputSectionProps {
  url: string;
  setUrl: (val: string) => void;
  onSearch: (customUrl?: string) => void;
  isLoading: boolean;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function UrlInputSection({
  url,
  setUrl,
  onSearch,
  isLoading,
  onToast,
}: UrlInputSectionProps) {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');

  const checkPlatform = (val: string): Platform => {
    const lower = val.toLowerCase().trim();
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
    return 'unknown';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setDetectedPlatform(checkPlatform(val));
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const trimmed = text.trim();
          setUrl(trimmed);
          const platform = checkPlatform(trimmed);
          setDetectedPlatform(platform);
          onToast('info', 'Enlace pegado del portapapeles');
          return;
        }
      }
      onToast('error', 'No se pudo acceder al portapapeles. Pégalo manualmente.');
    } catch {
      onToast('error', 'Permiso denegado para el portapapeles. Pega usando Ctrl+V.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setDetectedPlatform('unknown');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      onToast('error', 'Por favor ingresa o pega un enlace');
      return;
    }
    onSearch();
  };

  // Sample quick test links
  const sampleTikTok = 'https://www.tiktok.com/@user/video/7684397094420892961';
  const sampleInstagram = 'https://www.instagram.com/reel/C32sP2iM_5k/';

  const handleApplySample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setDetectedPlatform(checkPlatform(sampleUrl));
    onSearch(sampleUrl);
  };

  return (
    <section id="url-input-section" className="w-full pt-6 sm:pt-10 pb-3 sm:pb-4 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badges / Platform tags */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 mb-3 sm:mb-4 shadow-sm transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"></span>
          <span>Soporte rápido para Reels, Videos y Audios</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug sm:leading-tight transition-colors px-1">
          Descarga videos de <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 dark:from-cyan-400 dark:via-sky-400 dark:to-indigo-400">
            TikTok
          </span>{' '}
          e{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 dark:from-rose-400 dark:via-pink-400 dark:to-amber-300">
            Instagram
          </span>
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-400 mt-2 max-w-lg mx-auto leading-relaxed px-2 transition-colors">
          Pega el enlace directo para obtener el video en MP4 en alta calidad, sin marcas de agua o en audio MP3.
        </p>

        {/* Input Form: Fully responsive on mobile and desktop */}
        <form onSubmit={handleSubmit} className="mt-5 sm:mt-7 w-full">
          <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-2.5">
            {/* Input card container */}
            <div className="relative flex-1 flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus-within:border-neutral-400 dark:focus-within:border-neutral-600 rounded-2xl px-2.5 sm:px-3 h-13 sm:h-12 shadow-sm dark:shadow-none transition-all">
              {/* Detected platform badge inside input */}
              <div className="flex items-center shrink-0 pr-1">
                {detectedPlatform === 'tiktok' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-cyan-50 dark:bg-neutral-800 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
                    TikTok
                  </span>
                ) : detectedPlatform === 'instagram' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-pink-50 dark:bg-neutral-800 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 dark:bg-pink-400"></span>
                    Instagram
                  </span>
                ) : (
                  <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 ml-1" />
                )}
              </div>

              {/* Input Element */}
              <input
                id="video-url-input"
                type="url"
                value={url}
                onChange={handleInputChange}
                placeholder="Pega el enlace de TikTok o Instagram..."
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
              />

              {/* Utility action inside input (Clear or Paste) */}
              <div className="flex items-center shrink-0 pl-1">
                {url ? (
                  <button
                    type="button"
                    id="btn-clear-url"
                    onClick={handleClear}
                    className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors touch-manipulation"
                    title="Limpiar campo"
                    aria-label="Limpiar campo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-paste-url"
                    onClick={handlePaste}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700/60 transition-colors touch-manipulation active:scale-95"
                    title="Pegar del portapapeles"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Pegar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit / Extract Button (Full width on mobile, inline on desktop) */}
            <button
              type="submit"
              id="btn-submit-search"
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-rose-600 via-pink-600 to-cyan-600 hover:from-rose-500 hover:via-pink-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-600/20 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 touch-manipulation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Obtener Video</span>
                </>
              )}
            </button>
          </div>

          {/* Instagram alert banner when Instagram URL is typed */}
          {detectedPlatform === 'instagram' && (
            <div className="mt-3 p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-900 dark:text-pink-200 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-pink-800 dark:text-pink-300">Enlace de Instagram detectado</p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  Meta bloquea las descargas directas en la web sin servidor backend. Al pulsar <strong>Obtener Video</strong> te guiaremos con opciones para este enlace o puedes probar con TikTok que descarga directamente.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Quick sample chip */}
        <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="text-[11px] sm:text-xs text-neutral-500">¿Quieres probar ahora mismo?</span>
          <button
            type="button"
            id="btn-sample-tiktok"
            onClick={() => handleApplySample(sampleTikTok)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors touch-manipulation text-[11px] sm:text-xs font-semibold active:scale-95"
          >
            <Play className="w-3 h-3 text-cyan-600 dark:text-cyan-400 fill-cyan-600 dark:fill-cyan-400" />
            <span>Probar video real de ejemplo</span>
          </button>
        </div>
      </div>
    </section>
  );
}
