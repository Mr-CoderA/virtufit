'use client';

import { useState, useRef } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export function DocsPlayground({ baseUrl }: { baseUrl?: string }) {
  const resolvedBaseUrl =
    baseUrl ??
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '');
  const toast = useToast();
  const [apiKey, setApiKey] = useState('');
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [garmentFiles, setGarmentFiles] = useState<File[]>([]);
  const [tier, setTier] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<object | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const personRef = useRef<HTMLInputElement>(null);
  const garmentRef = useRef<HTMLInputElement>(null);

  async function runRequest() {
    if (!apiKey.trim()) {
      toast.error('Enter your API key');
      return;
    }
    if (!personFile) {
      toast.error('Upload a person photo');
      return;
    }
    if (garmentFiles.length === 0) {
      toast.error('Upload at least one garment image');
      return;
    }

    setLoading(true);
    setResponse(null);
    setResultUrl(null);

    try {
      const form = new FormData();
      form.append('person_image', personFile);
      garmentFiles.forEach((f) => form.append('garment_image', f));
      form.append('tier', tier);
      form.append('swap_target', 'full_outfit');

      const res = await fetch(`${resolvedBaseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey.trim() },
        body: form,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      setResponse({ status: res.status, ...data });
      if (data.output_url) setResultUrl(data.output_url);
      if (!res.ok) toast.error(data.error || `Request failed (${res.status})`);
      else toast.success('Request succeeded');
    } catch (e) {
      setResponse({ error: e instanceof Error ? e.message : 'Network error' });
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-6" style={{ borderWidth: '0.5px' }}>
      <h2
        className="mb-4 flex items-center gap-2 text-[20px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <Zap className="h-5 w-5 text-[var(--vf-accent)]" />
        Live API playground
      </h2>
      <p className="text-[14px] text-[var(--vf-muted)] mb-4">
        Logged-in users can test the API here. Paste your API key, upload images, and send a real request.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)] mb-1">API key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="vf_..."
            className="w-full rounded-[10px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] py-2.5 px-3 text-[14px] text-[var(--vf-ink)] placeholder-[var(--vf-quiet)] focus:outline-none focus:border-[rgba(21,43,67,0.28)]"
            style={{ borderWidth: '0.5px' }}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)] mb-1">Person photo</label>
            <input ref={personRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setPersonFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => personRef.current?.click()} className="rounded-[10px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] py-2.5 px-3 text-[13px] text-[var(--vf-muted)] hover:text-[var(--vf-ink)]">
              {personFile ? personFile.name : 'Choose file'}
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)] mb-1">Garment image(s)</label>
            <input ref={garmentRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => setGarmentFiles(Array.from(e.target.files ?? []))} />
            <button type="button" onClick={() => garmentRef.current?.click()} className="rounded-[10px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] py-2.5 px-3 text-[13px] text-[var(--vf-muted)] hover:text-[var(--vf-ink)]">
              {garmentFiles.length ? `${garmentFiles.length} file(s)` : 'Choose files'}
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)] mb-1">Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-[10px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] py-2.5 px-3 text-[14px] text-[var(--vf-ink)] focus:outline-none focus:border-[rgba(21,43,67,0.28)]" style={{ borderWidth: '0.5px' }}>
              <option value="nano">nano</option>
              <option value="basic">basic</option>
              <option value="pro">pro</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={runRequest}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--vf-ink)] text-[var(--vf-page)] py-2.5 px-5 text-[14px] font-medium hover:opacity-88 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {loading ? 'Sending…' : 'Send request'}
        </button>
      </div>

      {response && (
        <div className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)] mb-2">Response</p>
          <pre className="overflow-x-auto rounded-[10px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-page)] p-4 font-mono text-[12px] text-[var(--vf-muted)] whitespace-pre-wrap break-all" style={{ borderWidth: '0.5px' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
          {resultUrl && (
            <div className="mt-3">
              <p className="text-[12px] text-[var(--vf-quiet)] mb-1">Output image:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Result" className="max-w-full max-h-64 rounded-[10px] border border-[rgba(21,43,67,0.14)]" style={{ borderWidth: '0.5px' }} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
