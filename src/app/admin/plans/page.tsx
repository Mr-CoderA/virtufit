'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

type Plan = { id: string; name: string; key: string; welcomeCredits: number | null; status: string; updatedAt: string };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<{ plans: Plan[] }>('/plans').then((r) => {
      if (r.data?.plans) setPlans(r.data.plans);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-[#A09E97] text-[14px] py-12 text-center">Loading…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Plans & Pricing</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">Manage plan tiers and welcome credits.</p>
      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
          <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
            <thead>
              <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Name</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Key</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Credits</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Last updated</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27]" style={{ borderBottomWidth: '0.5px' }}>
                  <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">{p.name}</td>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{p.key}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {p.welcomeCredits != null ? <span className="text-[#F0EFE8] text-[13px]" style={{ fontFamily: 'Georgia, serif' }}>{p.welcomeCredits}</span> : <span className="text-[#65635D] text-[13px]">—</span>}
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(p.updatedAt).toLocaleString()}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[12px] ${p.status === 'active' ? 'bg-[rgba(217,113,74,0.1)] text-[#D9714A]' : 'bg-[rgba(160,158,151,0.1)] text-[#65635D]'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Link href={`/admin/plans/${p.id}`} className="inline-flex rounded-full border border-[rgba(240,239,232,0.14)] px-3 py-1 text-[12px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors">
                      Edit
                    </Link>
                  </td>
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
