'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/api/adminApi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await adminApi.login(email.trim(), password);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--vf-page)] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 100 100" className="shrink-0">
              <rect width="100" height="100" rx="24" fill="var(--vf-surface)" />
              <circle cx="50" cy="26" r="10" fill="none" stroke="var(--vf-ink)" strokeWidth="2" />
              <path d="M30,42 L20,47 L22,62 L34,58 L32,78 L68,78 L66,58 L78,62 L80,47 L70,42 L50,54 Z" fill="none" stroke="var(--vf-ink)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M38,42 L50,54 L62,42" fill="none" stroke="var(--vf-ink)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M78,18 L80,23 L85,25 L80,27 L78,32 L76,27 L71,25 L76,23 Z" fill="var(--vf-accent)" />
            </svg>
            <span className="text-[20px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>VirtuFit</span>
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-5 sm:p-8" style={{ borderWidth: '0.5px' }}>
          <h1 className="text-[22px] font-normal text-[var(--vf-ink)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Admin</h1>
          <p className="text-[14px] text-[var(--vf-muted)] mb-6">Sign in to the VirtuFit admin panel.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-[14px] text-[#E24B4A] bg-[rgba(226,75,74,0.08)] border border-[rgba(226,75,74,0.3)] rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="admin-email" className="block text-[12px] font-medium text-[var(--vf-muted)] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--vf-quiet)]" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--vf-page)] border border-[rgba(21,43,67,0.14)] rounded-lg pl-10 pr-3 py-2.5 text-[14px] text-[var(--vf-ink)] placeholder:text-[var(--vf-quiet)] focus:outline-none focus:border-[var(--vf-accent)]"
                  placeholder="Enter your admin email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-[12px] font-medium text-[var(--vf-muted)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--vf-quiet)]" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--vf-page)] border border-[rgba(21,43,67,0.14)] rounded-lg pl-10 pr-10 py-2.5 text-[14px] text-[var(--vf-ink)] placeholder:text-[var(--vf-quiet)] focus:outline-none focus:border-[var(--vf-accent)]"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--vf-quiet)] hover:text-[var(--vf-muted)]"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--vf-accent)] text-[var(--vf-page)] font-medium py-2.5 text-[14px] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in to admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
