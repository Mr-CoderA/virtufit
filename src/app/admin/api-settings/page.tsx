'use client';

import { useState, useEffect } from 'react';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

type ContactSettingRow = { value: string; updatedAt: string | null; updatedBy: string | null };
type ContactSettingsResponse = Record<string, ContactSettingRow>;

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
  const [contactSettings, setContactSettings] = useState<ContactSettingsResponse | null>(null);
  const [contactForm, setContactForm] = useState({
    support_email: '',
    support_phone: '',
    whatsapp_number: '',
    founder_name: '',
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    adminFetch<typeof settings>('/api-settings').then((r) => {
      if (r.data) {
        setSettings(r.data);
        setCosts(r.data.creditCosts);
        setBaseApiUrl(r.data.baseApiUrl ?? '');
      }
    });
    adminFetch<ContactSettingsResponse>('/settings/contact').then((r) => {
      if (r.data) {
        setContactSettings(r.data);
        setContactForm({
          support_email: r.data.support_email?.value ?? 'asadalinawaz700@gmail.com',
          support_phone: r.data.support_phone?.value ?? '+923213889791',
          whatsapp_number: r.data.whatsapp_number?.value ?? '923213889791',
          founder_name: r.data.founder_name?.value ?? 'Asad Ali',
        });
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

  const saveContactSettings = () => {
    setContactError('');
    setContactSuccess(false);
    const token = localStorage.getItem('adminToken');
    setContactSaving(true);
    fetch('/api/admin/settings/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(contactForm),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setContactError(d.error);
        } else {
          setContactSuccess(true);
          setTimeout(() => setContactSuccess(false), 3000);
          if (contactSettings) {
            setContactSettings({
              ...contactSettings,
              support_email: { ...contactSettings.support_email, value: contactForm.support_email, updatedAt: new Date().toISOString(), updatedBy: null },
              support_phone: { ...contactSettings.support_phone, value: contactForm.support_phone, updatedAt: new Date().toISOString(), updatedBy: null },
              whatsapp_number: { ...contactSettings.whatsapp_number, value: contactForm.whatsapp_number, updatedAt: new Date().toISOString(), updatedBy: null },
              founder_name: { ...contactSettings.founder_name, value: contactForm.founder_name, updatedAt: new Date().toISOString(), updatedBy: null },
            });
          }
        }
      })
      .catch(() => setContactError('Request failed'))
      .finally(() => setContactSaving(false));
  };

  const contactRow = (key: keyof typeof contactForm, label: string, description: string, type: 'email' | 'text' = 'text', placeholder = '') => {
    const row = contactSettings?.[key];
    return (
      <div key={key} className="mb-4">
        <label className="block text-[13px] font-medium text-[#F0EFE8] mb-1">{label}</label>
        <p className="text-[12px] text-[#A09E97] mb-1.5">{description}</p>
        <input
          type={type}
          value={contactForm[key]}
          onChange={(e) => setContactForm({ ...contactForm, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8] placeholder:text-[#65635D]"
        />
        {row?.updatedAt && (
          <p className="mt-1 text-[11px] text-[#65635D]">
            Last updated: {new Date(row.updatedAt).toLocaleString()}
            {row.updatedBy ? ` by ${row.updatedBy}` : ''}
          </p>
        )}
      </div>
    );
  };

  if (!settings) return <p className="text-[#A09E97]">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#D9714A] mb-2">GENERAL SETTINGS</p>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Contact & support</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {contactRow('support_email', 'Support email', 'Shown on landing page, emails, and error messages.', 'email')}
            {contactRow('support_phone', 'Support phone', 'Shown on contact page and WhatsApp link.', 'text', '+923213889791')}
            {contactRow('whatsapp_number', 'WhatsApp number', 'Used in wa.me links. Include country code, no + or spaces. e.g. 923213889791', 'text', '923213889791')}
            {contactRow('founder_name', 'Founder / contact name', 'Shown in email signatures and footer.', 'text', 'Asad Ali')}
            {contactError && <p className="text-[13px] text-[#e24b4a] mb-2">{contactError}</p>}
            {contactSuccess && <p className="text-[13px] text-[#2d8a2d] mb-2">Contact settings updated</p>}
            <button type="button" onClick={saveContactSettings} disabled={contactSaving} className="rounded-full bg-[#F0EFE8] text-[#1A1915] px-6 py-3 text-[13px] font-medium hover:opacity-90 disabled:opacity-50">
              {contactSaving ? 'Saving…' : 'Save contact settings'}
            </button>
          </div>
          <div className="rounded-lg border border-[rgba(240,239,232,0.08)] bg-[#1A1915] p-4">
            <p className="text-[12px] font-medium text-[#F0EFE8] mb-3">Preview — how it appears to users</p>
            <p className="text-[12px] text-[#A09E97] mb-1">Email footer:</p>
            <p className="text-[13px] text-[#F0EFE8] mb-3">Questions? {contactForm.support_email}</p>
            <p className="text-[12px] text-[#A09E97] mb-1">Contact page:</p>
            <p className="text-[13px] text-[#F0EFE8]">Email: {contactForm.support_email}</p>
            <p className="text-[13px] text-[#F0EFE8]">Phone: {contactForm.support_phone}</p>
            <p className="text-[13px] text-[#F0EFE8]">WhatsApp: {contactForm.whatsapp_number}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Base API URL</h3>
        <p className="text-[13px] text-[#A09E97] mb-2">Used in documentation, integrations, and dashboard. No trailing slash.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="url"
            value={baseApiUrl}
            onChange={(e) => setBaseApiUrl(e.target.value)}
            placeholder="https://virtufit.xyz"
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
