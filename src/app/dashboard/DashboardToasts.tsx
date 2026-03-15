'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

export function DashboardToasts() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    const topup = searchParams.get('topup');
    if (topup === 'success' && !shown.current) {
      shown.current = true;
      toast.success('Payment received. Your credits have been added.', {
        title: 'Top-up complete',
        duration: 6000,
      });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, toast]);

  return null;
}
