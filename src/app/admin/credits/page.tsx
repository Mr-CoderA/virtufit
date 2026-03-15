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
      .then((r) => r.json())
      .then(() => { setSavingRate(false); if (overview) setOverview({ ...overview, creditRatePerCredit: num.toFixed(2) }); });
  };

  if (!overview) return <p className="text-[#A09E97]">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase mb-1">Total credits in circulation</p>
          <p className="text-[22px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.totalCreditsInCirculation}</p>
        </div>
        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase mb-1">Credits granted this month</p>
          <p className="text-[22px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.creditsGrantedThisMonth}</p>
        </div>
        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase mb-1">Credits consumed this month</p>
          <p className="text-[22px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.creditsConsumedThisMonth}</p>
        </div>
        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
          <p className="text-[12px] text-[#65635D] uppercase mb-1">Credits purchased this month</p>
          <p className="text-[22px] text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{overview.creditsPurchasedThisMonth}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-2">Credit rate</h3>
        <p className="text-[13px] text-[#A09E97] mb-2">Current rate: ${overview.creditRatePerCredit} per credit</p>
        <div className="flex items-center gap-2">
          <input type="number" step="0.01" min="0.01" max="10" value={rateEdit} onChange={(e) => setRateEdit(e.target.value)} className="rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8] w-24" />
          <span className="text-[#A09E97] text-[13px]">$ per credit</span>
          <button type="button" onClick={saveRate} disabled={savingRate} className="rounded-lg bg-[#D9714A] text-[#1A1915] px-4 py-2 text-[13px] font-medium disabled:opacity-50">Save</button>
        </div>
        <p className="text-[12px] text-[#65635D] mt-2">$5 = {rateEdit ? (5 / parseFloat(rateEdit)).toFixed(0) : '—'} credits at this rate</p>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] p-4 border-b border-[rgba(240,239,232,0.08)]">Brands with low credits (&lt;5)</h3>
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-[#65635D]"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Balance</th><th className="p-3">Last top-up</th></tr></thead>
          <tbody>
            {lowBalance.map((u) => (
              <tr key={u.id} className="border-t border-[rgba(240,239,232,0.06)]">
                <td className="p-3"><Link href={`/admin/brands/${u.id}`} className="text-[#D9714A] hover:underline">{u.name || u.email}</Link></td>
                <td className="p-3 text-[#A09E97]">{u.email}</td>
                <td className="p-3 text-[#F0EFE8]">{u.credits}</td>
                <td className="p-3 text-[#A09E97]">{u.lastTopUp ? new Date(u.lastTopUp).toLocaleDateString() : '—'}</td>
                <td className="p-3"><button type="button" className="text-[#D9714A] hover:underline text-[12px]">Send reminder</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] p-4 border-b border-[rgba(240,239,232,0.08)]">Manual credit operations log</h3>
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-[#65635D]"><th className="p-3">Date</th><th className="p-3">Brand</th><th className="p-3">Amount</th><th className="p-3">Type</th><th className="p-3">Reason</th></tr></thead>
          <tbody>
            {manualLog.map((l, i) => (
              <tr key={i} className="border-t border-[rgba(240,239,232,0.06)]">
                <td className="p-3 text-[#A09E97]">{new Date(l.date).toLocaleString()}</td>
                <td className="p-3 text-[#F0EFE8]">{l.brand}</td>
                <td className={`p-3 ${l.amount >= 0 ? 'text-[#2d8a2d]' : 'text-[#e0a0a0]'}`}>{l.amount >= 0 ? '+' : ''}{l.amount}</td>
                <td className="p-3 text-[#A09E97]">{l.type}</td>
                <td className="p-3 text-[#A09E97]">{l.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
