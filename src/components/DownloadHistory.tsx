import { Trash2, Download, History, Clock } from 'lucide-react';
import { DownloadHistoryItem } from '../types';
import { downloadFileUniversal } from '../services/clientExtractor';

interface DownloadHistoryProps {
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function DownloadHistory({
  history,
  onClearHistory,
  onRemoveItem,
  onClose,
  isOpen,
}: DownloadHistoryProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      id="history-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="history-modal-content"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 transition-colors truncate">
                Historial de Descargas
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 transition-colors truncate">
                {history.length} {history.length === 1 ? 'archivo guardado' : 'archivos guardados'} en este navegador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {history.length > 0 && (
              <button
                type="button"
                id="btn-clear-all-history"
                onClick={onClearHistory}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors touch-manipulation font-medium"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              id="btn-close-history"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm touch-manipulation"
              aria-label="Cerrar modal de historial"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1 overscroll-contain">
          {history.length === 0 ? (
            <div className="py-10 text-center px-4">
              <Clock className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors">
                Aún no tienes descargas recientes
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Los videos, audios o fotos que descargues aparecerán aquí para que puedas volver a acceder a ellos rápidamente.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
              >
                {/* Thumbnail */}
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-11 h-14 sm:w-12 sm:h-16 object-cover rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-800"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.platform === 'tiktok'
                          ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60'
                          : item.platform === 'facebook'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                            : 'bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60'
                      }`}
                    >
                      {item.platform === 'facebook' ? 'facebook' : item.platform}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-neutral-500 truncate">
                      {formatDate(item.downloadDate)}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 truncate transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate transition-colors">
                    Por {item.author} · {item.mediaType === 'audio' ? 'Audio MP3' : item.mediaType === 'image' ? 'Miniatura' : 'Video MP4'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFileUniversal(
                        item.downloadUrl,
                        `${item.platform}_download.${
                          item.mediaType === 'audio' ? 'mp3' : item.mediaType === 'image' ? 'jpg' : 'mp4'
                        }`
                      )
                    }
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-xl transition-colors touch-manipulation"
                    title="Descargar de nuevo"
                    aria-label="Descargar de nuevo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-xl transition-colors touch-manipulation"
                    title="Eliminar del historial"
                    aria-label="Eliminar del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
