'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { Toast, type ToastItem, type ToastVariant } from './Toast';

interface ToastOptions {
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  add: (message: string, variant?: ToastVariant, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let id = 0;
function generateId() {
  return `toast-${++id}-${Date.now()}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const add = useCallback(
    (message: string, variant: ToastVariant = 'info', options?: ToastOptions) => {
      const toast: ToastItem = {
        id: generateId(),
        message,
        title: options?.title,
        variant,
        duration: options?.duration ?? 5000,
      };
      setToasts((prev) => [...prev.slice(-4), toast]);
    },
    []
  );

  const success = useCallback((message: string, options?: ToastOptions) => add(message, 'success', options), [add]);
  const error = useCallback((message: string, options?: ToastOptions) => add(message, 'error', options), [add]);
  const warning = useCallback((message: string, options?: ToastOptions) => add(message, 'warning', options), [add]);
  const info = useCallback((message: string, options?: ToastOptions) => add(message, 'info', options), [add]);

  const value: ToastContextValue = { toasts, add, success, error, warning, info, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
      >
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

const noop = () => {};
const noopToast: ToastContextValue = {
  toasts: [],
  add: noop,
  success: noop,
  error: noop,
  warning: noop,
  info: noop,
  dismiss: noop,
};

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? noopToast;
}
