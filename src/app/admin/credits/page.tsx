'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

export default function AdminCreditsPage() {
  const [overview, setOverview] = useState<{
    totalCreditsInCirculation: number;
    creditsGrantedThisMonth: number;
    creditsConsumedThisMonth: number;
    creditsPurchasedThisMonth: number;
    creditRatePerCredit: string;
  } | null>(null);
  const [lowBalance, setLowBalance] = useState<Array<{ id: string; name: string | null; email: string; credits: number; lastTopUp: string | null }>>([]);
  const [manualLog, setManualLog] = useState<Array<{ date: string; brand: string; amount: number; type: string; reason: string | null }>>([]);
  const [rateEdit, setRateEdit] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    adminFetch<typeof overview>('/credits/overview').then((r) => r.data && setOverview(r.data));
    adminFetch<{ items: typeof lowBalance }>('/credits/low-balance').then((r) => r.data?.items && setLowBalance(r.data.items));
    adminFetch<{ items: typeof manualLog }>('/credits/manual-log').then((r) => r.data?.items && setManualLog(r.data.items));
  }, []);

  useEffect(() => {
    if (overview) setRateEdit(overview.creditRatePerCredit);
  }, [overview?.creditRatePerCredit]);

  const saveRate = () => {
    const num = parseFloat(rateEdit);
    if (Number.isNaN(num) || num < 0.01 || num > 10) return;
    setSavingRate(true);
    const token = localStorage.getItem('adminToken');
    fetch('/api/admin/settings/credit-rate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ rate: num }),
    })
      .then((r) => (r.ok ? r.json().then(() => { if (overview) setOverview({ ...overview, creditRatePerCredit: num.toFixed(2) }); }) : Promise.reject(new Error('Failed'))))
      .catch(() => { /* keep rateEdit as-is on failure */ })
      .finally(() => setSavingRate(false));
  };

  if (!overview) return <p className="text-[#A09E97] text-[14px] py-12 text-center">Loading…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Credits</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">Credit rate and low-balance brands.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase tracking-[0.08em] mb-1">Total credits in circulation</p>
          <p className="text-[32px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.totalCreditsInCirculation}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase tracking-[0.08em] mb-1">Credits granted this month</p>
          <p className="text-[32px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.creditsGrantedThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase tracking-[0.08em] mb-1">Credits consumed this month</p>
          <p className="text-[32px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.creditsConsumedThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase tracking-[0.08em] mb-1">Credits purchased this month</p>
          <p className="text-[32px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.creditsPurchasedThisMonth}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Credit rate</h3>
        <p className="text-[13px] text-[#A09E97] mb-4">Current rate: ${overview.creditRatePerCredit} per credit</p>
        <div className="flex items-center gap-2">
          <input type="number" step="0.01" min="0.01" max="10" value={rateEdit} onChange={(e) => setRateEdit(e.target.value)} className="rounded-lg border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] px-3.5 py-2 text-[13px] text-[#F0EFE8] placeholder:text-[#65635D] w-24 outline-none focus:border-[rgba(240,239,232,0.3)]" />
          <span className="text-[#A09E97] text-[13px]">$ per credit</span>
          <button type="button" onClick={saveRate} disabled={savingRate} className="rounded-full bg-[#F0EFE8] text-[#1A1915] px-5 py-2 text-[13px] font-medium border-0 hover:opacity-90 disabled:opacity-50 transition-opacity">
            Save
          </button>
        </div>
        <p className="text-[12px] text-[#65635D] mt-2">$5 = {(() => { const r = parseFloat(rateEdit); return r > 0 && Number.isFinite(r) ? (5 / r).toFixed(0) : '—'; })()} credits at this rate</p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        <h3 className="text-[20px] font-normal text-[#F0EFE8] p-5 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Brands with low credits (&lt;5)</h3>
        <p className="text-[13px] text-[#A09E97] px-5 mb-4">Brands that may need a top-up reminder.</p>
        <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
          <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
            <thead>
              <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Name</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Email</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Balance</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Last top-up</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lowBalance.map((u) => (
                <tr key={u.id} className="border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27]" style={{ borderBottomWidth: '0.5px' }}>
                  <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap"><Link href={`/admin/brands/${u.id}`} className="text-[#D9714A] hover:underline">{u.name || u.email}</Link></td>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{u.email}</td>
                  <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] whitespace-nowrap">{u.credits}</td>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{u.lastTopUp ? new Date(u.lastTopUp).toLocaleDateString() : '—'}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap"><button type="button" className="text-[#D9714A] hover:underline text-[12px]">Send reminder</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        <h3 className="text-[20px] font-normal text-[#F0EFE8] p-5 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Manual credit operations log</h3>
        <p className="text-[13px] text-[#A09E97] px-5 mb-4">Recent grant/deduction history.</p>
        <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
          <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
            <thead>
              <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Date</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Brand</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Amount</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Type</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Reason</th>
              </tr>
            </thead>
            <tbody>
              {manualLog.map((l, i) => (
                <tr key={i} className="border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27]" style={{ borderBottomWidth: '0.5px' }}>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(l.date).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">{l.brand}</td>
                  <td className={`py-3.5 px-4 text-[13px] whitespace-nowrap ${l.amount >= 0 ? 'text-[#D9714A]' : 'text-[#E24B4A]'}`}>{l.amount >= 0 ? '+' : ''}{l.amount}</td>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{l.type}</td>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{l.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
      </div>
    </div>
  );
}
