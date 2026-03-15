'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ButtonLink } from '@/components/ui/Button';

type Status = 'loading' | 'success' | 'error';

export default function ConfirmDeletionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    fetch(`/api/auth/confirm-deletion?token=${encodeURIComponent(token)}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.message) {
          setName(data.name ?? null);
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
        <GlassCard className="p-10 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#D9714A]" />
          <p className="mt-4 text-[15px] text-[#A09E97]">Processing your request...</p>
        </GlassCard>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
        <GlassCard className="p-10 text-center max-w-[420px]">
          <h1 className="text-[22px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>
            Your account has been deleted.
          </h1>
          <p className="mt-3 text-[15px] text-[#A09E97]">
            We&apos;re sorry to see you go{name ? `, ${name}` : ''}.
          </p>
          <p className="mt-2 text-[14px] text-[#A09E97]">
            All your data will be retained for 90 days.
          </p>
          <p className="mt-6 text-[14px] text-[#A09E97]">
            <ButtonLink href="/" variant="ghost" size="sm" className="text-[#D9714A]">
              Changed your mind? Contact support
            </ButtonLink>
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
      <GlassCard className="p-10 text-center max-w-[420px]">
        <h1 className="text-[22px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>
          This link has expired or is invalid.
        </h1>
        <p className="mt-3 text-[15px] text-[#A09E97]">
          Log in to request a new deletion link.
        </p>
        <ButtonLink href="/login" className="mt-6 inline-block" variant="primary">
          Log in
        </ButtonLink>
      </GlassCard>
    </div>
  );
}
