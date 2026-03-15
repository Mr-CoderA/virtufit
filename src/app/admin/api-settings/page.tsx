'use client';

import { useState, useEffect } from 'react';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

export default function AdminApiSettingsPage() {
  const [settings, setSettings] = useState<{
    replicate: { model: string; version: string };
    creditCosts: { nano: number; basic: number; pro: number };
    creditRateCents: number;
    baseApiUrl: string;
    widget: { url: string; version: string };
  } | null>(null);
  const [costs, setCosts] = useState({ nano: 1, basic: 1, pro: 3 });
  const [baseApiUrl, setBaseApiUrl] = useState('');
  const [baseApiUrlSaving, setBaseApiUrlSaving] = useState(false);
  const [replicateOk, setReplicateOk] = useState<boolean | null>(null);

  useEffect(() => {
    adminFetch<typeof settings>('/api-settings').then((r) => {
      if (r.data) {
        setSettings(r.data);
        setCosts(r.data.creditCosts);
        setBaseApiUrl(r.data.baseApiUrl ?? '');
      }
    });
  }, []);

  const testReplicate = () => {
    setReplicateOk(null);
    adminFetch<{ success: boolean }>('/api-settings/test-replicate').then((r) => setReplicateOk(r.data?.success ?? false));
  };

  const saveCosts = () => {
    const token = localStorage.getItem('adminToken');
    fetch('/api/admin/api-settings/credit-costs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(costs),
    });
  };

  const saveBaseApiUrl = () => {
    setBaseApiUrlSaving(true);
    const token = localStorage.getItem('adminToken');
    fetch('/api/admin/api-settings/base-api-url', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ url: baseApiUrl }),
    })
      .then((r) => r.json())
      .then(() => setBaseApiUrlSaving(false))
      .catch(() => setBaseApiUrlSaving(false));
  };

  if (!settings) return <p className="text-[#A09E97]">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Base API URL</h3>
        <p className="text-[13px] text-[#A09E97] mb-2">Used in documentation, integrations, and dashboard. No trailing slash.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="url"
            value={baseApiUrl}
            onChange={(e) => setBaseApiUrl(e.target.value)}
            placeholder="https://api.virtufit.com"
            className="flex-1 min-w-[280px] rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8] placeholder:text-[#65635D]"
          />
          <button type="button" onClick={saveBaseApiUrl} disabled={baseApiUrlSaving} className="rounded-lg bg-[#D9714A] text-[#1A1915] px-4 py-2 text-[13px] font-medium disabled:opacity-50">
            {baseApiUrlSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Replicate</h3>
        <p className="text-[13px] text-[#A09E97]">Model: {settings.replicate.model}</p>
        <p className="text-[13px] text-[#A09E97] mb-2">Resolution: Nano → 1 credit, Basic → 1, Pro → 3</p>
        <button type="button" onClick={testReplicate} className="rounded-lg bg-[#222219] border border-[rgba(240,239,232,0.12)] px-4 py-2 text-[13px] text-[#F0EFE8] hover:bg-[#2C2C27]">
          Test Replicate connection
        </button>
        {replicateOk !== null && <span className="ml-2 text-[13px]">{replicateOk ? '✓ OK' : '✗ Failed'}</span>}
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Credit costs per tier</h3>
        <div className="flex gap-4 mb-2">
          <div><label className="block text-[12px] text-[#A09E97]">Nano</label><input type="number" min={1} max={10} value={costs.nano} onChange={(e) => setCosts({ ...costs, nano: parseInt(e.target.value, 10) || 1 })} className="w-20 rounded border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-2 py-1 text-[#F0EFE8]" /></div>
          <div><label className="block text-[12px] text-[#A09E97]">Basic</label><input type="number" min={1} max={10} value={costs.basic} onChange={(e) => setCosts({ ...costs, basic: parseInt(e.target.value, 10) || 1 })} className="w-20 rounded border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-2 py-1 text-[#F0EFE8]" /></div>
          <div><label className="block text-[12px] text-[#A09E97]">Pro</label><input type="number" min={1} max={10} value={costs.pro} onChange={(e) => setCosts({ ...costs, pro: parseInt(e.target.value, 10) || 3 })} className="w-20 rounded border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-2 py-1 text-[#F0EFE8]" /></div>
        </div>
        <button type="button" onClick={saveCosts} className="rounded-lg bg-[#D9714A] text-[#1A1915] px-4 py-2 text-[13px] font-medium">Save</button>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-2">Widget</h3>
        <p className="text-[13px] text-[#A09E97]">URL: {settings.widget.url}</p>
        <p className="text-[13px] text-[#A09E97]">Version: {settings.widget.version}</p>
      </div>
    </div>
  );
}
