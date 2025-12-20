import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Simple toast store
let toastId = 0;
let listeners = [];
let toasts = [];

export const toast = {
  show: (message, type = 'info', duration = 5000) => {
    const id = ++toastId;
    const newToast = { id, message, type, duration };
    toasts = [...toasts, newToast];
    listeners.forEach(listener => listener(toasts));

    if (duration > 0) {
      setTimeout(() => toast.dismiss(id), duration);
    }

    return id;
  },
  success: (message, duration) => toast.show(message, 'success', duration),
  error: (message, duration) => toast.show(message, 'error', duration),
  warning: (message, duration) => toast.show(message, 'warning', duration),
  info: (message, duration) => toast.show(message, 'info', duration),
  dismiss: (id) => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(listener => listener(toasts));
  },
  dismissAll: () => {
    toasts = [];
    listeners.forEach(listener => listener(toasts));
  }
};

const useToasts = () => {
  const [state, setState] = useState(toasts);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter(l => l !== setState);
    };
  }, []);

  return state;
};

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colors = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white'
};

export const Toaster = () => {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        const colorClass = colors[t.type] || colors.info;

        return (
          <div
            key={t.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto
              animate-in slide-in-from-right-full duration-300
              ${colorClass}
            `}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;