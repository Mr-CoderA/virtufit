'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowLeft, X } from 'lucide-react';
import BlurText from '@/components/ui/BlurText';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/components/ui/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const closedMessage = searchParams.get('closed') === '1';

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError('');
    const trimmedCode = verifyCode.trim().replace(/\s/g, '');
    if (!/^\d{6}$/.test(trimmedCode)) {
      setVerifyError('Please enter the 6-digit code from your email.');
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: trimmedCode }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.token) {
        try {
          localStorage.setItem('brandToken', data.token);
        } catch {
          // ignore
        }
        toast.success('Email verified! Redirecting...', { title: 'Welcome', duration: 2000 });
        setShowCodeModal(false);
        setVerifyCode('');
        router.push('/dashboard');
        router.refresh();
        return;
      }
      setVerifyError(data.message || data.error || 'Invalid or expired code. Try again or request a new one.');
    } catch {
      setVerifyError('Something went wrong. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResendVerification() {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && !data.error) setResendSent(true);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setError('EMAIL_NOT_VERIFIED');
          setEmail(data.email ?? email);
        } else {
          const msg = data.error || 'Login failed';
          setError(msg);
          toast.error(msg, { title: 'Sign in failed' });
        }
        return;
      }
      toast.success('Redirecting to dashboard...', { title: 'Welcome back', duration: 2000 });
      router.push('/dashboard');
      router.refresh();
    } catch {
      const msg = 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
      <div className="relative z-10 w-full max-w-[420px]">
        <GlassCard className="p-7 sm:p-10">
          <div className="mb-10">
            <h1
              className="text-[28px] font-normal tracking-[-0.025em] text-[#F0EFE8] mb-3 [&_span]:text-[#F0EFE8]"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              <BlurText text="Welcome back" delay={60} animateBy="words" direction="top" className="text-[#F0EFE8]" />
            </h1>
            <p className="text-[15px] leading-[1.75] font-normal text-[#A09E97]">
              Sign in to your account to continue.
            </p>
            {closedMessage && (
              <p className="mt-3 rounded-2xl border border-[rgba(226,75,74,0.3)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-[14px] text-[#e0a0a0]">
                Your account has been closed. Contact support if you need help.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && error === 'EMAIL_NOT_VERIFIED' && (
              <div
                role="alert"
                className="rounded-2xl border border-[rgba(240,239,232,0.14)] bg-[#222219] px-4 py-3 text-[15px] text-[#A09E97]"
              >
                <p>Please verify your email first.</p>
                {resendSent ? (
                  <p className="mt-2 text-[14px] text-[#2d8a2d]">Verification email sent! Check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="mt-2 text-[14px] text-[#D9714A] hover:underline"
                  >
                    Resend verification email →
                  </button>
                )}
                <p className="mt-3 text-[14px] text-[#F0EFE8]">Enter the 6-digit code from your email:</p>
                <button
                  type="button"
                  onClick={() => { setShowCodeModal(true); setVerifyError(''); setVerifyCode(''); }}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-[#D9714A] bg-[#D9714A]/10 px-4 py-2 text-[14px] font-medium text-[#D9714A] hover:bg-[#D9714A]/20"
                >
                  Enter verification code
                </button>
              </div>
            )}
            {error && error !== 'EMAIL_NOT_VERIFIED' && (
              <div
                role="alert"
                className="rounded-2xl border border-[rgba(240,239,232,0.14)] bg-[#222219] px-4 py-3 text-[15px] text-[#A09E97]"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[13px] font-normal text-[#A09E97] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#65635D]" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input-glass"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[13px] font-normal text-[#A09E97] flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#65635D]" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-glass"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              leftIcon={!loading ? <Lock className="h-5 w-5" /> : undefined}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Verification code modal */}
          {showCodeModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
              onClick={() => setShowCodeModal(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="verify-code-title"
            >
              <div
                className="relative w-full max-w-[400px] rounded-2xl border border-[rgba(240,239,232,0.14)] bg-[#1A1915] p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="absolute right-4 top-4 rounded p-1 text-[#A09E97] hover:bg-[#222219] hover:text-[#F0EFE8]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 id="verify-code-title" className="pr-8 text-[20px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>
                  Enter verification code
                </h2>
                <p className="mt-1 text-[14px] text-[#A09E97]">
                  We sent a 6-digit code to <span className="text-[#F0EFE8]">{email || 'your email'}</span>
                </p>
                {verifyError && (
                  <p className="mt-3 text-[14px] text-[#e24b4a]" role="alert">
                    {verifyError}
                  </p>
                )}
                <form onSubmit={handleVerifyCode} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="modal-verify-code" className="block text-[13px] text-[#A09E97] mb-1.5">
                      Code
                    </label>
                    <input
                      id="modal-verify-code"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="input-glass w-full text-center text-[22px] tracking-[0.3em] font-mono"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    loading={verifyLoading}
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Verifying...' : 'Verify and sign in'}
                  </Button>
                </form>
                <p className="mt-4 text-center text-[13px] text-[#A09E97]">
                  Didn&apos;t get the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-[#D9714A] hover:underline"
                  >
                    Resend code
                  </button>
                </p>
              </div>
            </div>
          )}

          <p className="mt-10 text-center text-[15px] text-[#A09E97]">
            Don&apos;t have an account?{' '}
            <ButtonLink href="/signup" variant="ghost" size="sm" className="inline-flex text-[#D9714A] hover:text-[#F0EFE8]">
              Sign up
            </ButtonLink>
          </p>
        </GlassCard>
        <p className="mt-8 text-center">
          <ButtonLink href="/" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to home
          </ButtonLink>
        </p>
      </div>
    </div>
  );
}
