import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UrlInputSection } from './components/UrlInputSection';
import { VideoResultCard } from './components/VideoResultCard';
import { DownloadHistory } from './components/DownloadHistory';
import { AppIdeasModal } from './components/AppIdeasModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { InstagramNoticeModal } from './components/InstagramNoticeModal';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { VideoMediaInfo, DownloadHistoryItem } from './types';
import { extractMediaClient } from './services/clientExtractor';

const STORAGE_KEY = 'snapflow_download_history';
const THEME_STORAGE_KEY = 'snapflow_theme_preference';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState<VideoMediaInfo | null>(null);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isIdeasOpen, setIsIdeasOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isInstagramNoticeOpen, setIsInstagramNoticeOpen] = useState(false);
  const [currentInstagramUrl, setCurrentInstagramUrl] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Theme state: defaults to 'dark', persists in localStorage, syncs with documentElement.classList
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'dark';
  });

  // Apply theme to documentElement class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    addToast('info', `Modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'} activado`);
  };

  // Load history on mount & purge any old mock items
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: DownloadHistoryItem[] = JSON.parse(stored);
        const cleaned = parsed.filter(
          (item) =>
            item.downloadUrl &&
            !item.downloadUrl.includes('flower') &&
            !item.downloadUrl.includes('cc0-videos') &&
            !item.downloadUrl.includes('mixkit')
        );
        setHistory(cleaned);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (items: DownloadHistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving history:', e);
    }
  };

  const handleAddHistory = (item: DownloadHistoryItem) => {
    const updated = [item, ...history.filter((h) => h.downloadUrl !== item.downloadUrl)].slice(0, 50);
    saveHistory(updated);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
  };

  const handleClearHistory = () => {
    saveHistory([]);
    addToast('info', 'Historial vaciado');
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSearch = async (customUrl?: string) => {
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) {
      addToast('error', 'Por favor ingresa un enlace válido.');
      return;
    }

    setIsLoading(true);
    setMediaResult(null);

    let extractedData: VideoMediaInfo | null = null;
    let customMessage: string | undefined = undefined;

    // 1. Try server-side extract first if NOT running on a static host like GitHub Pages
    const isStaticHost = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

    if (!isStaticHost) {
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            extractedData = json.data;
            customMessage = json.message;
          }
        }
      } catch (e) {
        console.warn('Backend /api/extract unavailable, falling back to client extractor:', e);
      }
    }

    // 2. Client-side direct extractor fallback (Runs directly in browser, perfect for GitHub Pages)
    let errorMessage = '';
    if (!extractedData) {
      try {
        extractedData = await extractMediaClient(targetUrl);
      } catch (clientErr: any) {
        console.warn('Client extraction error:', clientErr);
        errorMessage = clientErr?.message || 'Error al procesar el enlace.';
      }
    }

    if (extractedData) {
      setMediaResult(extractedData);
      addToast('success', '¡Video procesado con éxito!');

      if (customMessage) {
        setTimeout(() => {
          addToast('info', customMessage);
        }, 1200);
      }

      // Smooth scroll to result
      setTimeout(() => {
        document.getElementById('video-result-card')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setMediaResult(null);
      const isIg = targetUrl.toLowerCase().includes('instagram.com') || targetUrl.toLowerCase().includes('instagr.am');
      if (isIg) {
        setCurrentInstagramUrl(targetUrl);
        setIsInstagramNoticeOpen(true);
        addToast('info', 'Aviso de Instagram: Revisa las opciones en pantalla.');
      } else {
        addToast('error', errorMessage || 'No se pudo obtener el video real. Asegúrate de que sea un video público.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-rose-500/20 selection:text-rose-700 dark:selection:bg-rose-500/30 dark:selection:text-rose-200 transition-colors duration-200">
      {/* Header with Theme Toggle */}
      <Header
        historyCount={history.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenIdeas={() => setIsIdeasOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col items-center">
        {/* URL Input Form */}
        <UrlInputSection
          url={url}
          setUrl={setUrl}
          onSearch={handleSearch}
          isLoading={isLoading}
          onToast={addToast}
        />

        {/* Video Result Card */}
        {mediaResult && (
          <VideoResultCard
            media={mediaResult}
            onToast={addToast}
            onAddHistory={handleAddHistory}
          />
        )}

        {/* Features & Roadmap Section */}
        <FeaturesShowcase onOpenIdeas={() => setIsIdeasOpen(true)} />
      </main>

      {/* Responsive Minimal Footer */}
      <footer className="w-full border-t border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-transparent py-5 sm:py-6 px-3 sm:px-4 text-center text-xs text-neutral-500 dark:text-neutral-400 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[11px] sm:text-xs">
            Descargador de Videos para TikTok e Instagram · Gratuito y sin marcas de agua
          </p>
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-[11px] sm:text-xs">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="py-1.5 px-2 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors rounded-lg touch-manipulation"
            >
              Guía de uso
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              onClick={() => setIsIdeasOpen(true)}
              className="py-1.5 px-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-medium rounded-lg touch-manipulation"
            >
              Ideas de Expansión
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="py-1.5 px-2 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors rounded-lg touch-manipulation"
            >
              Historial ({history.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DownloadHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onRemoveItem={handleRemoveHistoryItem}
      />

      <AppIdeasModal
        isOpen={isIdeasOpen}
        onClose={() => setIsIdeasOpen(false)}
      />

      <HowItWorksModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <InstagramNoticeModal
        isOpen={isInstagramNoticeOpen}
        onClose={() => setIsInstagramNoticeOpen(false)}
        instagramUrl={currentInstagramUrl}
        onTryTikTok={() => {
          const sample = 'https://www.tiktok.com/@user/video/7684397094420892961';
          setUrl(sample);
          handleSearch(sample);
        }}
      />

      {/* Toast notifications */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
