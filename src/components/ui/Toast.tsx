'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration?: number;
}

const variantStyles: Record<ToastVariant, { border: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-[rgba(21,43,67,0.14)]',
    icon: <CheckCircle2 className="h-5 w-5 text-[var(--vf-accent)]" />,
  },
  error: {
    border: 'border-[rgba(21,43,67,0.14)]',
    icon: <XCircle className="h-5 w-5 text-[#A06E5B]" />,
  },
  warning: {
    border: 'border-[rgba(21,43,67,0.14)]',
    icon: <AlertCircle className="h-5 w-5 text-[var(--vf-accent)]" />,
  },
  info: {
    border: 'border-[rgba(21,43,67,0.14)]',
    icon: <Info className="h-5 w-5 text-[var(--vf-muted)]" />,
  },
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const duration = toast.duration ?? 5000;
  const style = variantStyles[toast.variant];

  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(t);
  }, [duration, toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={`toast-enter flex items-start gap-3 rounded-2xl border bg-[var(--vf-surface)] overflow-hidden min-w-[320px] max-w-[420px] ${style.border}`}
    >
      <div className="flex-shrink-0 rounded-2xl p-2.5 mt-3.5 ml-3.5 bg-[var(--vf-surface-hover)] border border-[rgba(21,43,67,0.14)]">
        {style.icon}
      </div>
      <div className="flex-1 min-w-0 py-3.5 pr-3">
        {toast.title && (
          <p className="font-medium text-[var(--vf-ink)] text-[13px] mb-0.5">{toast.title}</p>
        )}
        <p className="text-[var(--vf-muted)] text-[15px] leading-relaxed">{toast.message}</p>
        {duration > 0 && (
          <div
            className="h-0.5 mt-2 overflow-hidden origin-left rounded-full bg-[rgba(21,43,67,0.14)]"
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
            }}
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-2 mt-2 mr-2 rounded-full text-[var(--vf-quiet)] hover:text-[var(--vf-ink)] hover:bg-[rgba(21,43,67,0.14)] transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(21,43,67,0.14)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
