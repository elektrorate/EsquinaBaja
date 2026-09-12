import { Copy, Sparkles, Download, ShieldCheck, Smartphone } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="help-modal-content"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shrink-0">
              <Sparkles className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 transition-colors truncate">
                ¿Cómo usar el descargador?
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 transition-colors truncate">
                Guía rápida de 3 pasos sencillos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm shrink-0 touch-manipulation"
            aria-label="Cerrar modal de ayuda"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto py-3 sm:py-4 space-y-3 sm:space-y-4 flex-1 pr-1 overscroll-contain">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80">
            <div className="w-7 h-7 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-800 dark:text-neutral-200 shrink-0 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              1
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-200 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" /> Copia el enlace
              </h4>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                En TikTok o Instagram, abre el video deseado, pulsa en el botón de <strong>Compartir</strong> y elige <strong>«Copiar enlace»</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80">
            <div className="w-7 h-7 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-800 dark:text-neutral-200 shrink-0 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              2
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 shrink-0" /> Pega en el buscador
              </h4>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                Regresa a esta app y pulsa el botón <strong>«Pegar»</strong> o pega el enlace en la caja de texto. Luego haz clic en <strong>«Obtener Video»</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80">
            <div className="w-7 h-7 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-800 dark:text-neutral-200 shrink-0 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              3
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Elige el formato y descarga
              </h4>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                Podrás previsualizar el video y descargarlo en <strong>MP4 sin marca de agua</strong>, extraer únicamente el <strong>Audio MP3</strong> o guardar la <strong>Miniatura en HD</strong>.
              </p>
            </div>
          </div>

          {/* Guarantees */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2.5 sm:gap-3">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
              <strong>Compatibilidad:</strong> Los videos de <strong>TikTok</strong> se descargan al 100% de forma directa e ilimitada. En <strong>Instagram</strong>, Meta requiere autenticación activa; te asistimos para obtenerlo sin engaños.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-10 sm:h-auto px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors touch-manipulation flex items-center justify-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
