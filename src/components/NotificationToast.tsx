import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:bottom-5 z-50 flex flex-col gap-2 sm:max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          id={`toast-${t.id}`}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            t.type === 'success'
              ? 'bg-white/95 dark:bg-neutral-900/95 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : t.type === 'error'
              ? 'bg-white/95 dark:bg-neutral-900/95 border-rose-500/30 text-rose-800 dark:text-rose-300'
              : 'bg-white/95 dark:bg-neutral-900/95 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />}
            {t.type === 'info' && <Info className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />}
            <span className="text-neutral-900 dark:text-neutral-100">{t.message}</span>
          </div>
          <button
            id={`toast-close-${t.id}`}
            onClick={() => onDismiss(t.id)}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ml-2 shrink-0"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
