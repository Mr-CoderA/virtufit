'use client';

import { useState } from 'react';
import { Copy, Key, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export function DashboardApiAccess({ baseUrl }: { baseUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyBaseUrl() {
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-8 w-full max-w-full box-border overflow-hidden">
      <div>
        <h2
          className="text-[18px] font-normal tracking-[-0.025em] text-[var(--vf-ink)] mb-1"
          style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
        >
          API access
        </h2>
        <p className="text-[13px] text-[var(--vf-muted)]">
          Use these details to authenticate and send requests to the VirtuFit API.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 w-full max-w-full box-border">
        <div className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] p-4 md:p-5 w-full max-w-full box-border overflow-hidden">
          <p className="text-[11px] uppercase tracking-wider text-[var(--vf-quiet)] mb-2">Base URL</p>
          <div className="flex items-center gap-2 w-full min-w-0 box-border overflow-hidden">
            <code className="flex-1 min-w-0 text-[12px] md:text-[13px] text-[var(--vf-ink)] font-mono break-all overflow-hidden" style={{ overflowWrap: 'break-word' }}>
              {baseUrl}
            </code>
            <button
              type="button"
              onClick={copyBaseUrl}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] px-3 py-1.5 md:py-2 text-[12px] font-medium text-[var(--vf-muted)] hover:bg-[var(--vf-surface-hover)] hover:text-[var(--vf-ink)] transition-colors duration-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--vf-accent)]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] p-4 md:p-5 flex flex-col justify-between gap-4 w-full max-w-full box-border overflow-hidden">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-[var(--vf-quiet)] mb-2">API key</p>
            <p className="text-[13px] text-[var(--vf-muted)] break-all" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
              Required in the <code className="text-[var(--vf-quiet)] font-mono text-[11px] break-all">Authorization</code> header or as a query parameter.
            </p>
          </div>
          <ButtonLink
            href="/dashboard/api-keys"
            variant="secondary"
            size="sm"
            className="w-full md:w-fit max-w-full box-border"
            leftIcon={<Key className="h-4 w-4" />}
          >
            Manage API keys
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
