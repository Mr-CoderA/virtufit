'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
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
  const closedMessage = searchParams.get('closed') === '1';

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
        const msg = data.error || 'Login failed';
        setError(msg);
        toast.error(msg, { title: 'Sign in failed' });
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
            {error && (
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
