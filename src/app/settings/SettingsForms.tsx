'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Trash2, ArrowLeft, Monitor, ChevronDown, Coins } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { GlassCardInner } from '@/components/ui/GlassCard';
import { useToast } from '@/components/ui/ToastProvider';
import { brandFetch } from '@/lib/brand-api';

export const RESOLUTION_OPTIONS = [
  { value: '1K', label: '1K', credits: 1 },
  { value: '2K', label: '2K', credits: 2 },
  { value: '4K', label: '4K', credits: 3 },
] as const;

export function SettingsForms({ initialResolution = '1K' }: { initialResolution?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [resolution, setResolution] = useState(initialResolution);
  const [resolutionLoading, setResolutionLoading] = useState(false);
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);

  useEffect(() => {
    setResolution(initialResolution);
  }, [initialResolution]);

  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordNew !== passwordConfirm) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordNew.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      toast.warning('New password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await brandFetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordCurrent,
          newPassword: passwordNew,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Failed to change password';
        setPasswordMessage({ type: 'error', text: msg });
        toast.error(msg, { title: 'Password update failed' });
        return;
      }
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      toast.success('You can now use your new password to sign in.', { title: 'Password updated', duration: 6000 });
      setPasswordCurrent('');
      setPasswordNew('');
      setPasswordConfirm('');
    } catch {
      setPasswordMessage({ type: 'error', text: 'Something went wrong' });
      toast.error('Something went wrong.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleSaveResolution() {
    setResolutionLoading(true);
    try {
      const res = await brandFetch('/api/settings/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredResolution: resolution }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save resolution');
        return;
      }
      setResolutionDropdownOpen(false);
      toast.success('Resolution preference saved.', { title: 'Settings saved', duration: 4000 });
      router.refresh();
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setResolutionLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteMessage(null);
    if (deleteConfirm !== 'delete my account') {
      const msg = 'Please type "delete my account" to confirm.';
      setDeleteMessage({ type: 'error', text: msg });
      toast.warning(msg);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await brandFetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Failed to delete account';
        setDeleteMessage({ type: 'error', text: msg });
        toast.error(msg, { title: 'Could not delete account' });
        return;
      }
      toast.info('Account deleted. Redirecting...', { duration: 1500 });
      router.push('/');
      router.refresh();
    } catch {
      setDeleteMessage({ type: 'error', text: 'Something went wrong' });
      toast.error('Something went wrong.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const currentOption = RESOLUTION_OPTIONS.find((o) => o.value === resolution) ?? RESOLUTION_OPTIONS[0];

  return (
    <div className="space-y-[64px]">
      <GlassCardInner className="pr-14" cardNumber="01">
        <h3 className="eyebrow mb-3 flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5" />
          Default resolution
        </h3>
        <p className="text-[15px] leading-[1.75] text-[#A09E97] mb-6">
          Choose the resolution for your outputs. Credits are consumed per use: 1K = 1 credit, 2K = 2 credits, 4K = 3 credits.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setResolutionDropdownOpen((o) => !o)}
              className="input-glass flex items-center justify-between gap-3 min-w-[220px] py-3.5 px-4 text-left"
              aria-haspopup="listbox"
              aria-expanded={resolutionDropdownOpen}
              aria-label="Select resolution"
            >
              <span className="text-[#F0EFE8] font-medium text-[15px]">{currentOption.label}</span>
              <span className="text-[#65635D] text-[13px] flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                {currentOption.credits} {currentOption.credits === 1 ? 'credit' : 'credits'}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#65635D] transition-opacity duration-200 ${resolutionDropdownOpen ? 'opacity-70' : ''}`}
              />
            </button>
            {resolutionDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setResolutionDropdownOpen(false)}
                />
                <ul
                  role="listbox"
                  className="absolute left-0 top-full mt-1 z-20 min-w-[220px] rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden py-1"
                >
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={resolution === opt.value}
                      onClick={() => {
                        setResolution(opt.value);
                        setResolutionDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-200 ${
                        resolution === opt.value
                          ? 'bg-[#2C2C27] text-[#F0EFE8]'
                          : 'text-[#A09E97] hover:bg-[rgba(240,239,232,0.05)] hover:text-[#F0EFE8]'
                      }`}
                    >
                      <span className="font-medium text-[15px]">{opt.label}</span>
                      <span className="text-[#65635D] text-[13px] flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" />
                        {opt.credits} {opt.credits === 1 ? 'credit' : 'credits'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSaveResolution}
            loading={resolutionLoading}
            disabled={resolutionLoading}
          >
            Save settings
          </Button>
        </div>
      </GlassCardInner>

      <GlassCardInner className="pr-14" cardNumber="02">
        <h3 className="eyebrow mb-6 flex items-center gap-2">
          <Key className="h-3.5 w-3.5" />
          Change password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-5">
          {passwordMessage && (
            <div
              role="alert"
              className={
                passwordMessage.type === 'success'
                  ? 'rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] px-4 py-3 text-[15px] text-[#A09E97]'
                  : 'rounded-2xl border border-[rgba(240,239,232,0.14)] bg-[#222219] px-4 py-3 text-[15px] text-[#A09E97]'
              }
            >
              {passwordMessage.text}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="current-password" className="block text-[13px] font-normal text-[#A09E97]">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={passwordCurrent}
              onChange={(e) => setPasswordCurrent(e.target.value)}
              required
              autoComplete="current-password"
              className="input-glass"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-[13px] font-normal text-[#A09E97]">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={passwordNew}
              onChange={(e) => setPasswordNew(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="input-glass"
              placeholder="At least 6 characters"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-[13px] font-normal text-[#A09E97]">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="input-glass"
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={passwordLoading}
            disabled={passwordLoading}
          >
            Update password
          </Button>
        </form>
      </GlassCardInner>

      <GlassCardInner className="pr-14 border-[rgba(240,239,232,0.14)]" cardNumber="03">
        <h3 className="eyebrow mb-3 flex items-center gap-2 text-[#D9714A]">
          <Trash2 className="h-3.5 w-3.5" />
          Danger zone
        </h3>
        <p className="text-[15px] leading-[1.75] text-[#A09E97] mb-6">
          Deleting your account will permanently remove your data. This cannot be undone.
        </p>
        <form onSubmit={handleDeleteAccount} className="space-y-5">
          {deleteMessage && deleteMessage.type === 'error' && (
            <div
              role="alert"
              className="rounded-2xl border border-[rgba(240,239,232,0.14)] bg-[#222219] px-4 py-3 text-[15px] text-[#A09E97]"
            >
              {deleteMessage.text}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="delete-password" className="block text-[13px] font-normal text-[#A09E97]">
              Your password
            </label>
            <input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input-glass"
              placeholder="Enter your password to confirm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="delete-confirm" className="block text-[13px] font-normal text-[#A09E97]">
              Type <span className="font-mono text-[#D9714A]">&quot;delete my account&quot;</span> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              required
              className="input-glass"
              placeholder="delete my account"
            />
          </div>
          <Button
            type="submit"
            variant="danger"
            size="md"
            loading={deleteLoading}
            disabled={deleteLoading}
          >
            Delete my account
          </Button>
        </form>
      </GlassCardInner>

      <ButtonLink href="/dashboard" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
