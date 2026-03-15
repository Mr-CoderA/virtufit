'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowLeft, RotateCcw, Check } from 'lucide-react';
import BlurText from '@/components/ui/BlurText';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/components/ui/ToastProvider';

type RecoverablePayload = {
  deletedAt: string;
  reactivatableUntil: string;
  daysRemaining: number;
  deletedBy?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reactivationModal, setReactivationModal] = useState<RecoverablePayload | null>(null);
  const [reactivationPassword, setReactivationPassword] = useState('');
  const [reactivationError, setReactivationError] = useState('');
  const [reactivationLoading, setReactivationLoading] = useState(false);
  const [createNewConfirmOpen, setCreateNewConfirmOpen] = useState(false);

  const isAdminDeleted = reactivationModal && reactivationModal.deletedBy != null && reactivationModal.deletedBy !== email.trim().toLowerCase();

  const closeReactivationModal = useCallback(() => {
    setReactivationModal(null);
    setReactivationPassword('');
    setReactivationError('');
    setCreateNewConfirmOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && reactivationModal && !createNewConfirmOpen) {
        setCreateNewConfirmOpen(true);
      } else if (e.key === 'Escape' && createNewConfirmOpen) {
        setCreateNewConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [reactivationModal, createNewConfirmOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setReactivationModal(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.code === 'ACCOUNT_RECOVERABLE') {
          setReactivationModal({
            deletedAt: data.deletedAt ?? new Date().toISOString(),
            reactivatableUntil: data.reactivatableUntil ?? '',
            daysRemaining: data.daysRemaining ?? 0,
            deletedBy: data.deletedBy,
          });
          return;
        }
        const msg = data.error || 'Signup failed';
        setError(msg);
        toast.error(msg, { title: 'Sign up failed' });
        return;
      }
      toast.success('Check your email for the verification code.', { title: 'Almost there!' });
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      const msg = 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivate() {
    if (!reactivationModal) return;
    setReactivationError('');
    setReactivationLoading(true);
    try {
      const res = await fetch('/api/auth/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: reactivationPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token && typeof data.token === 'string') {
          try {
            localStorage.setItem('brandToken', data.token);
          } catch {
            /* ignore */
          }
        }
        toast.success('Welcome back! Your account has been restored.', { title: 'Account reactivated' });
        closeReactivationModal();
        router.push('/dashboard');
        return;
      }
      if (res.status === 423) {
        setReactivationError(data.message || 'Too many attempts. Try again in 30 minutes or contact support.');
        return;
      }
      if (res.status === 401) {
        setReactivationError(data.message || 'Incorrect password. Enter the password from your old account.');
        return;
      }
      setReactivationError(data.error || 'Reactivation failed');
    } catch {
      setReactivationError('Something went wrong');
    } finally {
      setReactivationLoading(false);
    }
  }

  function handleUseDifferentEmail() {
    setCreateNewConfirmOpen(false);
    closeReactivationModal();
    setEmail('');
    const el = document.getElementById('email');
    if (el && 'focus' in el) (el as HTMLInputElement).focus();
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#1A1915] px-4 py-[64px]">
      <div className="relative z-10 flex flex-col items-center w-full max-w-[420px]">
        <GlassCard className="w-full p-7 sm:p-10">
          <div className="mb-10">
            <h1
              className="text-[28px] font-normal tracking-[-0.025em] text-[#F0EFE8] mb-3"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              <BlurText text="Create an account" delay={60} animateBy="words" direction="top" className="text-[#F0EFE8]" />
            </h1>
            <p className="text-[15px] leading-[1.75] font-normal text-[#A09E97]">
              Get started with your free account.
            </p>
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
              <label htmlFor="name" className="block text-[13px] font-normal text-[#A09E97] flex items-center gap-2">
                <User className="h-4 w-4 text-[#65635D]" />
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="input-glass"
                placeholder="Your name"
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
                className="input-glass"
                placeholder="At least 6 characters"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              leftIcon={!loading ? <User className="h-5 w-5" /> : undefined}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <p className="mt-10 text-center text-[15px] text-[#A09E97]">
            Already have an account?{' '}
            <ButtonLink href="/login" variant="ghost" size="sm" className="inline-flex text-[#D9714A] hover:text-[#F0EFE8]">
              Sign in
            </ButtonLink>
          </p>
        </GlassCard>

        {reactivationModal && !createNewConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(217,113,74,0.2)] flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-[#D9714A]" />
                </div>
                <h2 className="text-[18px] font-medium text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>Welcome back</h2>
              </div>
              {isAdminDeleted ? (
                <>
                  <p className="text-[15px] text-[#A09E97] mb-6">
                    This account was closed. Contact us at asadalinawaz700@gmail.com to discuss reactivation.
                  </p>
                  <div className="flex justify-end">
                    <a
                      href="mailto:asadalinawaz700@gmail.com"
                      className="rounded-xl bg-[#D9714A] text-[#1A1915] px-4 py-2.5 text-[14px] font-medium hover:opacity-90"
                    >
                      Contact support
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[15px] text-[#A09E97] mb-2">
                    An account with this email was deleted {reactivationModal.daysRemaining === 0 ? 'recently' : `${90 - reactivationModal.daysRemaining} days ago`}.
                  </p>
                  <p className="text-[15px] text-[#A09E97] mb-4">
                    You can reactivate your old account and restore everything:
                  </p>
                  <ul className="text-[14px] text-[#F0EFE8] space-y-1.5 mb-4 list-none">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2d8a2d] shrink-0" /> Your previous credit balance</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2d8a2d] shrink-0" /> Your API key and usage history</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2d8a2d] shrink-0" /> All your integrations</li>
                  </ul>
                  <p className="text-[13px] text-[#A09E97] mb-4">
                    Reactivation is available for {reactivationModal.daysRemaining} more days (until {reactivationModal.reactivatableUntil ? new Date(reactivationModal.reactivatableUntil).toLocaleDateString() : '—'}).
                  </p>
                  <label className="block text-[13px] text-[#A09E97] mb-1.5">Enter your old account password to confirm</label>
                  <input
                    type="password"
                    value={reactivationPassword}
                    onChange={(e) => { setReactivationPassword(e.target.value); setReactivationError(''); }}
                    placeholder="Your previous password"
                    className="input-glass w-full mb-2"
                    autoComplete="current-password"
                  />
                  {reactivationError && <p className="text-[13px] text-[#e0a0a0] mb-3">{reactivationError}</p>}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button
                      type="button"
                      variant="primary"
                      className="flex-1"
                      loading={reactivationLoading}
                      disabled={reactivationLoading}
                      onClick={handleReactivate}
                    >
                      {reactivationLoading ? 'Reactivating…' : 'Reactivate my account'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="border border-[rgba(240,239,232,0.2)]"
                      onClick={() => setCreateNewConfirmOpen(true)}
                      disabled={reactivationLoading}
                    >
                      Create a new account instead
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {reactivationModal && createNewConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6 max-w-md w-full shadow-xl">
              <h3 className="text-[16px] font-medium text-[#F0EFE8] mb-3">Create new account?</h3>
              <p className="text-[15px] text-[#A09E97] mb-6">
                Creating a new account will use a different email address. Your old account data cannot be recovered after the reactivation window closes.
              </p>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setCreateNewConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={handleUseDifferentEmail}>
                  Use different email
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center">
          <ButtonLink href="/" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to home
          </ButtonLink>
        </p>
      </div>
    </div>
  );
}
