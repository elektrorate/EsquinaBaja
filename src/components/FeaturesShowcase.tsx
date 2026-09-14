import { Zap, Music, Smartphone, Sparkles, Video } from 'lucide-react';

interface FeaturesShowcaseProps {
  onOpenIdeas: () => void;
}

export function FeaturesShowcase({ onOpenIdeas }: FeaturesShowcaseProps) {
  const highlights = [
    {
      icon: Video,
      title: 'Sin marca de agua',
      desc: 'Descarga videos limpios de TikTok, Instagram, Facebook y X en máxima resolución.',
      color: 'text-rose-500 dark:text-rose-400',
    },
    {
      icon: Music,
      title: 'Extracción de Audio MP3',
      desc: 'Guarda únicamente la pista musical o audio original del video.',
      color: 'text-pink-500 dark:text-pink-400',
    },
    {
      icon: Zap,
      title: 'Rápido y Sin Registro',
      desc: 'Sin suscripciones ni límites de descargas diarias.',
      color: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      icon: Smartphone,
      title: '100% Responsivo',
      desc: 'Optimizado a la perfección para pantallas táctiles de iPhone, Android y PC.',
      color: 'text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <section id="features-showcase" className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      {/* 4 Key Pillars */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {highlights.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-sm dark:shadow-none transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60 mb-2 sm:mb-2.5">
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-200 mb-1 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed transition-colors">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Banner: Ideas de Expansión */}
      <div className="mt-4 sm:mt-6 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white via-neutral-50 to-cyan-50/70 dark:from-neutral-900 dark:via-neutral-900 dark:to-cyan-950/40 border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-3 text-left">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-200 transition-colors">
              ¿Quieres añadir más funciones a esta app?
            </h4>
            <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 transition-colors leading-relaxed">
              Explora 8 ideas de alto impacto: carruseles, conversión GIF, transcripción IA y más.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenIdeas}
          className="w-full sm:w-auto h-11 sm:h-auto px-4 py-2 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-950/60 border border-cyan-300/80 dark:border-cyan-700/60 hover:bg-cyan-200/80 dark:hover:bg-cyan-900/60 transition-colors shrink-0 shadow-sm touch-manipulation flex items-center justify-center"
        >
          Ver Todas las Ideas
        </button>
      </div>
    </section>
  );
}
