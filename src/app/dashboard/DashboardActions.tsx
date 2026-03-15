'use client';

import { useState, useEffect } from 'react';
import { TopUpModal } from '@/components/ui/TopUpModal';

export function DashboardActions() {
  const [topUpOpen, setTopUpOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setTopUpOpen(true);
    }
    window.addEventListener('open-topup', onOpen);
    return () => window.removeEventListener('open-topup', onOpen);
  }, []);

  return <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />;
}
