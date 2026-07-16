import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface Toast {
  id: number;
  type: 'alert' | 'info';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), 8000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`panel p-4 animate-slide-up flex items-start gap-3 ${
            toast.type === 'alert'
              ? 'border-scada-red/50 glow-red'
              : 'border-scada-accent/40'
          }`}
        >
          <div
            className={`p-1.5 rounded-md flex-shrink-0 ${
              toast.type === 'alert'
                ? 'bg-scada-red/15 text-scada-red animate-pulse-glow-red'
                : 'bg-scada-accent/10 text-scada-accent'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${toast.type === 'alert' ? 'text-scada-red' : 'text-scada-accent'}`}>
              {toast.title}
            </p>
            <p className="text-xs text-scada-textDim mt-0.5 font-mono">{toast.message}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-scada-textDim hover:text-scada-text flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
