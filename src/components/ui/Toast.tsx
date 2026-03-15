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
    border: 'border-[rgba(240,239,232,0.08)]',
    icon: <CheckCircle2 className="h-5 w-5 text-[#D9714A]" />,
  },
  error: {
    border: 'border-[rgba(240,239,232,0.14)]',
    icon: <XCircle className="h-5 w-5 text-[#A06E5B]" />,
  },
  warning: {
    border: 'border-[rgba(240,239,232,0.08)]',
    icon: <AlertCircle className="h-5 w-5 text-[#D9714A]" />,
  },
  info: {
    border: 'border-[rgba(240,239,232,0.08)]',
    icon: <Info className="h-5 w-5 text-[#A09E97]" />,
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
      className={`toast-enter flex items-start gap-3 rounded-2xl border bg-[#222219] overflow-hidden min-w-[320px] max-w-[420px] ${style.border}`}
    >
      <div className="flex-shrink-0 rounded-2xl p-2.5 mt-3.5 ml-3.5 bg-[#2C2C27] border border-[rgba(240,239,232,0.08)]">
        {style.icon}
      </div>
      <div className="flex-1 min-w-0 py-3.5 pr-3">
        {toast.title && (
          <p className="font-medium text-[#F0EFE8] text-[13px] mb-0.5">{toast.title}</p>
        )}
        <p className="text-[#A09E97] text-[15px] leading-relaxed">{toast.message}</p>
        {duration > 0 && (
          <div
            className="h-0.5 mt-2 overflow-hidden origin-left rounded-full bg-[rgba(240,239,232,0.14)]"
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
            }}
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-2 mt-2 mr-2 rounded-full text-[#65635D] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(240,239,232,0.14)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
