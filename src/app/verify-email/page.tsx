'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/Button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'expired'>('form');
  const [error, setError] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    setEmail((e) => e || emailParam);
  }, [emailParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim().replace(/\s/g, '');
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.message === 'Email verified successfully') {
        setName(data.brand?.name ?? null);
        setStatus('success');
        if (data.token) {
          try {
            localStorage.setItem('brandToken', data.token);
          } catch {
            // ignore
          }
        }
        // Redirect is handled by the useEffect below when status === 'success'
        return;
      }
      if (data.code === 'TOKEN_EXPIRED') {
        setStatus('expired');
        setError('');
        return;
      }
      setStatus('form');
      setError(data.message || data.error || 'Verification failed. Please try again.');
    } catch {
      setStatus('form');
      setError('Something went wrong. Please try again.');
    }
  }

  async function handleResend() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setResendSent(true);
        setStatus('form');
      } else {
        setError(data.error || 'Failed to send code.');
      }
    } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => { window.location.href = '/dashboard'; }, 3000);
    return () => clearTimeout(t);
  }, [status]);

  if (status === 'success') {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
        <GlassCard className="p-10 text-center max-w-[420px]">
          <CheckCircle className="mx-auto h-16 w-16 text-[#D9714A]" />
          <h1 className="mt-6 text-[24px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>
            Email verified!
          </h1>
          <p className="mt-3 text-[15px] text-[#A09E97]">
            Welcome to VirtuFit{name ? `, ${name}` : ''}. Your account is active.
          </p>
          <p className="mt-1 text-[14px] text-[#A09E97]">You have 5 free credits to get started.</p>
          <ButtonLink href="/dashboard" className="mt-8 inline-block" variant="primary" size="lg">
            Go to dashboard →
          </ButtonLink>
          <p className="mt-4 text-[12px] text-[#65635D]">Redirecting in 3 seconds...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
      <GlassCard className="p-10 max-w-[420px] w-full">
        <h1 className="text-[22px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>
          Verify your email
        </h1>
        <p className="mt-2 text-[15px] text-[#A09E97]">
          Enter the 6-digit code we sent to your email.
        </p>
        {resendSent && (
          <p className="mt-3 text-[14px] text-[#2d8a2d]">New code sent! Check your inbox.</p>
        )}
        {error && (
          <p className="mt-3 text-[14px] text-[#e24b4a]" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="verify-email" className="block text-[13px] text-[#A09E97] mb-1.5">
              Email
            </label>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-glass w-full"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="verify-code" className="block text-[13px] text-[#A09E97] mb-1.5">
              Verification code
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="input-glass w-full text-center text-[22px] tracking-[0.3em] font-mono"
              required
              autoComplete="one-time-code"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={status === 'loading'}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Verifying...' : 'Verify email'}
          </Button>
        </form>
        <p className="mt-6 text-[14px] text-[#A09E97]">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || !email.trim()}
            className="text-[#D9714A] hover:underline disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend code'}
          </button>
        </p>
        <p className="mt-4">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Back to login
          </ButtonLink>
        </p>
      </GlassCard>
    </div>
  );
}
