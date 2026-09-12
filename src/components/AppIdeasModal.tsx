import {
  Sparkles,
  Layers,
  FolderArchive,
  Scissors,
  Bot,
  Hash,
  Share2,
  Cloud,
  Send,
  Lightbulb,
} from 'lucide-react';

interface AppIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppIdeasModal({ isOpen, onClose }: AppIdeasModalProps) {
  if (!isOpen) return null;

  const ideas = [
    {
      icon: FolderArchive,
      title: 'Descarga de Carruseles y Álbumes en ZIP',
      desc: 'Permitir descargar todas las fotos y diapositivas de un carrusel de Instagram de una sola vez comprimidas en un archivo ZIP.',
      tag: 'Muy Solicitado',
      tagColor: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60',
    },
    {
      icon: Scissors,
      title: 'Editor Rápido y Conversor a GIF',
      desc: 'Herramienta para recortar la duración (trim), cambiar tamaño para historias o convertir fragmentos graciosos directamente en stickers o GIFs.',
      tag: 'Creatividad',
      tagColor: 'text-pink-800 dark:text-pink-300 bg-pink-100 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800/60',
    },
    {
      icon: Bot,
      title: 'Transcripción de Video a Texto con IA (Whisper/Gemini)',
      desc: 'Extraer el audio y generar los subtítulos o el guión completo en texto para creadores de contenido que deseen reutilizar ideas.',
      tag: 'Inteligencia Artificial',
      tagColor: 'text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/60',
    },
    {
      icon: Layers,
      title: 'Descarga Masiva por Creador (Batch Download)',
      desc: 'Ingresar el @nombre de un creador y descargar los últimos 5 o 10 videos más virales en una sola cola organizada.',
      tag: 'Pro',
      tagColor: 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
    },
    {
      icon: Hash,
      title: 'Extractor de Hashtags y Tendencias',
      desc: 'Copiar con un clic todos los hashtags, menciones y canciones en tendencia para analizar qué hace viral a cada video.',
      tag: 'Marketing',
      tagColor: 'text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/60',
    },
    {
      icon: Cloud,
      title: 'Guardado Directo en Google Drive o Dropbox',
      desc: 'Enviar los videos descargados directamente a tu almacenamiento en la nube sin gastar espacio ni memoria en tu celular.',
      tag: 'Productividad',
      tagColor: 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
    },
    {
      icon: Send,
      title: 'Bot de Telegram y Atajos de iOS/Android',
      desc: 'Integrar un bot donde solo envías el link por chat de Telegram y te devuelve el archivo MP4 listo para guardar.',
      tag: 'Automatización',
      tagColor: 'text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/60',
    },
    {
      icon: Share2,
      title: 'Multiplataforma (YouTube Shorts, X y Pinterest)',
      desc: 'Expandir el motor para admitir enlaces de YouTube Shorts, Twitter/X, Pinterest y Facebook Reels con el mismo diseño simple.',
      tag: 'Expansión',
      tagColor: 'text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
    },
  ];

  return (
    <div
      id="ideas-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="ideas-modal-content"
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 sm:pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-colors truncate">
                  Ideas de Expansión
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 shrink-0">
                  Roadmap
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 transition-colors line-clamp-1 sm:line-clamp-none">
                Funcionalidades recomendadas para potenciar tu herramienta
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-ideas"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 touch-manipulation"
            aria-label="Cerrar modal de ideas"
          >
            ✕
          </button>
        </div>

        {/* List of ideas */}
        <div className="overflow-y-auto py-3 sm:py-4 space-y-2.5 sm:space-y-3 flex-1 pr-1 overscroll-contain">
          {ideas.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                id={`idea-card-${idx}`}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-100/60 dark:hover:bg-neutral-950/80 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3.5"
              >
                <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-200 transition-colors">
                      {item.title}
                    </h4>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed transition-colors">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>Consejo: Diseña siempre priorizando la velocidad en móviles.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-10 sm:h-auto px-4 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors touch-manipulation flex items-center justify-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
