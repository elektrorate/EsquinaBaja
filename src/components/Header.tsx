import { History, Sparkles, HelpCircle, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onOpenIdeas: () => void;
  onOpenHelp: () => void;
}

export function Header({
  historyCount,
  theme,
  onToggleTheme,
  onOpenHistory,
  onOpenIdeas,
  onOpenHelp,
}: HeaderProps) {
  const isDark = theme === 'dark';

  return (
    <header
      id="app-header"
      className="w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-cyan-500 flex items-center justify-center p-0.5 shadow-md shadow-rose-500/10 dark:shadow-rose-950/40 shrink-0">
            <div className="w-full h-full bg-white dark:bg-neutral-950 rounded-[10px] flex items-center justify-center transition-colors">
              <span className="text-transparent bg-clip-text bg-gradient-to-tr from-rose-500 to-cyan-500 dark:from-rose-400 dark:to-cyan-300 font-black text-xs sm:text-sm tracking-tight">
                V↓
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight transition-colors truncate">
                Descargador
              </h1>
              <span className="hidden min-[480px]:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition-colors">
                TikTok & IG
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium hidden md:block transition-colors">
              Sin marca de agua · MP4 HD & Audio MP3
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            id="theme-toggle-button"
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors touch-manipulation"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Ideas & Roadmap button */}
          <button
            id="header-ideas-button"
            onClick={onOpenIdeas}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-xl text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 hover:bg-cyan-100/80 dark:hover:bg-cyan-900/40 transition-colors touch-manipulation"
            title="Ideas y funciones para esta app"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Ideas de Expansión</span>
            <span className="hidden min-[360px]:inline sm:hidden">Ideas</span>
          </button>

          {/* Help Button */}
          <button
            id="header-help-button"
            onClick={onOpenHelp}
            className="w-9 h-9 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-xl transition-colors touch-manipulation"
            title="¿Cómo funciona?"
            aria-label="Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* History Button */}
          <button
            id="header-history-button"
            onClick={onOpenHistory}
            className="relative w-9 h-9 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-xl transition-colors touch-manipulation"
            title="Historial de descargas"
            aria-label="Historial"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
