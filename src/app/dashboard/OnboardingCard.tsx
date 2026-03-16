'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Key, Zap, Store, CreditCard, Check } from 'lucide-react';
import { brandFetch } from '@/lib/brand-api';

type Step = { id: string; label: string; done: boolean };

export function OnboardingCard() {
  const [data, setData] = useState<{ completed: boolean; steps: Step[] } | null>(null);

  useEffect(() => {
    brandFetch('/api/onboarding', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);

  if (!data || data.completed) return null;

  const icons: Record<string, React.ReactNode> = {
    api_key: <Key className="h-4 w-4" />,
    first_call: <Zap className="h-4 w-4" />,
    integrate: <Store className="h-4 w-4" />,
    topup: <CreditCard className="h-4 w-4" />,
  };

  const links: Record<string, string> = {
    api_key: '/dashboard/api-keys',
    first_call: '/dashboard/demo',
    integrate: '/dashboard/integrate',
    topup: '/dashboard',
  };

  return (
    <section
      className="mb-8 w-full box-border rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] py-6 px-6"
      style={{ borderWidth: '0.5px' }}
    >
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
        Get started
      </p>
      <h2
        className="mb-4 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        4 steps to go live
      </h2>
      <ul className="space-y-0">
        {data.steps.map((step) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-3 border-b border-[rgba(240,239,232,0.06)] py-3 last:border-b-0"
            style={{ borderBottomWidth: '0.5px' }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  step.done
                    ? 'border-[#6b9b6b] bg-[#6b9b6b]/20 text-[#6b9b6b]'
                    : 'border-[rgba(240,239,232,0.14)] bg-[#2C2C27] text-[#65635D]'
                }`}
                style={{ borderWidth: '0.5px' }}
              >
                {step.done ? <Check className="h-4 w-4" /> : icons[step.id] || null}
              </span>
              <span className={`text-[14px] text-[#A09E97] ${step.done ? '' : 'text-[#F0EFE8]'}`}>
                {step.label}
              </span>
            </div>
            {!step.done && links[step.id] && (
              <Link
                href={links[step.id]}
                className="shrink-0 whitespace-nowrap text-[13px] text-[#D9714A] hover:text-[#F0EFE8] underline underline-offset-2"
              >
                Do this →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
