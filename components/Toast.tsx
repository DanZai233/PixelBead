import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContextValue {
  toast: (message: string, type?: 'error' | 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    const timer = setTimeout(() => removeToast(id), 4000);
    timers.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    return () => {
      timers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const typeStyles: Record<string, string> = {
    error: 'bg-red-500',
    success: 'bg-emerald-500',
    info: 'bg-indigo-500',
  };

  const typeIcons: Record<string, string> = {
    error: '⚠️',
    success: '✅',
    info: 'ℹ️',
  };

  return React.createElement(
    ToastContext.Provider,
    { value: { toast } },
    children,
    React.createElement(
      'div',
      { className: 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none' },
      toasts.map(t =>
        React.createElement(
          'div',
          {
            key: t.id,
            className: typeStyles[t.type] + ' text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl pointer-events-auto flex items-center gap-2 max-w-sm',
            onClick: () => removeToast(t.id),
          },
          React.createElement('span', null, typeIcons[t.type]),
          React.createElement('span', { className: 'flex-1' }, t.message)
        )
      )
    )
  );
};
