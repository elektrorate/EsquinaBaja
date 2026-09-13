import { ExternalLink, Copy, Check, Play, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface InstagramNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instagramUrl: string;
  onTryTikTok: () => void;
}

export function InstagramNoticeModal({
  isOpen,
  onClose,
  instagramUrl,
  onTryTikTok,
}: InstagramNoticeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (instagramUrl) {
      navigator.clipboard.writeText(instagramUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenAlternative = (serviceUrl: string) => {
    window.open(serviceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="instagram-notice-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="instagram-notice-modal-content"
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Aviso sobre Instagram
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Políticas de seguridad de Meta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/20 border border-pink-200/70 dark:border-pink-900/40 text-neutral-800 dark:text-neutral-200">
            <p className="font-semibold text-pink-700 dark:text-pink-300 mb-1">
              ¿Por qué no descarga este enlace directamente?
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              En esta versión web estática, <strong>Meta (Instagram)</strong> bloquea la extracción directa desde el navegador por políticas CORS y protección de datos. Para evitar engañarte, <strong>no descargamos videos falsos ni genéricos</strong>.
            </p>
          </div>

          <div>
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              Opciones recomendadas:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                id="btn-try-tiktok-from-modal"
                onClick={() => {
                  onClose();
                  onTryTikTok();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-200 font-semibold transition-colors text-xs sm:text-sm text-left"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-cyan-600 text-cyan-600 dark:fill-cyan-400 dark:text-cyan-400 shrink-0" />
                  <span>Descargar videos de TikTok (100% funcional)</span>
                </div>
                <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded-md uppercase font-bold">
                  Directo
                </span>
              </button>

              <button
                type="button"
                id="btn-open-snapinsta"
                onClick={() => handleOpenAlternative(`https://snapinsta.app/`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-950/50 border border-pink-200 dark:border-pink-800/60 text-pink-800 dark:text-pink-200 font-medium transition-colors text-xs sm:text-sm text-left"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
                  <span>Descargar este Reel en SnapInsta</span>
                </div>
                <span className="text-[10px] bg-pink-600 text-white px-2 py-0.5 rounded-md uppercase font-bold">
                  Gratis
                </span>
              </button>

              <button
                type="button"
                id="btn-open-fastdl"
                onClick={() => handleOpenAlternative(`https://fastdl.app/`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium transition-colors text-xs sm:text-sm text-left"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>Opción alternativa: FastDL.app</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
              ⚡ Backend en línea incluido (gratis):
            </p>
            <p>
              La app se conecta automáticamente a un backend gratuito que procesa los Reels de Instagram con el descargador yt-dlp. No requiere API keys ni pagos.
            </p>
          </div>

          {instagramUrl && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                {instagramUrl}
              </span>
              <button
                type="button"
                id="btn-copy-instagram-url"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar enlace</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
