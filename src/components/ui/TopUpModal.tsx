'use client';

import { useState, useRef, useEffect } from 'react';
import { X, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { brandFetch } from '@/lib/brand-api';

const PRESET_AMOUNTS = [1, 5, 10, 20, 50]; // USD; 1 credit = $0.20
function dollarsToCredits(dollars: number): number {
  return Math.floor(dollars * 5); // $0.20 per credit
}

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
}

export function TopUpModal({ open, onClose }: TopUpModalProps) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAmount('');
      setError(null);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  async function handleTopUp() {
    const value = amount === '' ? 0 : parseFloat(amount);
    if (value <= 0 || Number.isNaN(value)) return;
    setError(null);
    setLoading(true);
    try {
      const res = await brandFetch('/api/topup/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(value * 100) / 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Could not start checkout';
        setError(msg);
        toast.error(msg, { title: 'Checkout failed' });
        return;
      }
      if (data.url) {
        toast.info('Redirecting to payment...', { duration: 2000 });
        window.location.href = data.url;
        return;
      }
      setError('Invalid response');
      toast.error('Invalid response from server.');
    } catch {
      setError('Something went wrong');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const numAmount = amount === '' ? 0 : parseFloat(amount);
  const isValid = amount !== '' && !Number.isNaN(numAmount) && numAmount >= 0.2;
  const creditsPreview = isValid ? dollarsToCredits(numAmount) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1A1915]/85"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-title"
        className="relative w-full max-w-md rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden"
      >
        <div className="relative p-7 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#2C2C27] p-2.5 border border-[rgba(240,239,232,0.08)]">
                <DollarSign className="h-6 w-6 text-[#D9714A]" />
              </div>
              <h2
                id="topup-title"
                className="text-[20px] font-normal tracking-[-0.025em] text-[#F0EFE8]"
                style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
              >
                Top up credits
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[#65635D] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(240,239,232,0.14)]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-[15px] leading-[1.75] text-[#A09E97] mb-8">
            Enter the amount in USD. You get{' '}
            <strong className="font-medium text-[#D9714A]">5 credits per $1</strong> ($0.20 per credit). Powered by Lemon Squeezy.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-[rgba(240,239,232,0.14)] bg-[#1A1915] px-4 py-3 text-[15px] text-[#A09E97] mb-6"
            >
              {error}
            </div>
          )}

          <div className="mb-8">
            <label htmlFor="topup-amount" className="block text-[13px] font-normal text-[#A09E97] mb-2">
              Amount (USD)
            </label>
            <div
              className={`flex items-center gap-3 rounded-2xl border bg-[#1A1915] px-4 py-3.5 transition-colors duration-200 ${
                focused
                  ? 'border-[rgba(240,239,232,0.14)]'
                  : 'border-[rgba(240,239,232,0.08)] hover:border-[rgba(240,239,232,0.14)]'
              }`}
            >
              <span className="text-2xl font-medium text-[#D9714A]">$</span>
              <input
                ref={inputRef}
                id="topup-amount"
                type="number"
                min="0.2"
                step="0.2"
                max="9999"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="flex-1 bg-transparent text-2xl font-normal text-[#F0EFE8] placeholder-[#65635D] focus:outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="mb-8">
            <p className="eyebrow mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="rounded-full px-4 py-2.5 text-[13px] font-medium border border-[rgba(240,239,232,0.14)] bg-transparent text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors duration-200"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              disabled={!isValid || loading}
              loading={loading}
              onClick={handleTopUp}
            >
              <Sparkles className="h-4 w-4" />
              {isValid ? `Top up $${numAmount >= 1 ? Math.floor(numAmount) : numAmount.toFixed(1)} (${creditsPreview} credits)` : 'Top up'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
