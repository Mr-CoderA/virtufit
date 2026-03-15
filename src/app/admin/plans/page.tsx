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

  if (loading) return <p className="text-[#A09E97]">Loading…</p>;

  return (
    <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
      <table className="w-full text-[13px]">
        <thead><tr className="text-left text-[#65635D]"><th className="p-4">Name</th><th className="p-4">Key</th><th className="p-4">Credits</th><th className="p-4">Status</th><th className="p-4">Last updated</th><th className="p-4">Actions</th></tr></thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id} className="border-t border-[rgba(240,239,232,0.06)]">
              <td className="p-4 text-[#F0EFE8]">{p.name}</td>
              <td className="p-4 text-[#A09E97]">{p.key}</td>
              <td className="p-4 text-[#A09E97]">{p.welcomeCredits ?? '—'}</td>
              <td className="p-4 text-[#A09E97]">{p.status}</td>
              <td className="p-4 text-[#A09E97]">{new Date(p.updatedAt).toLocaleString()}</td>
              <td className="p-4"><Link href={`/admin/plans/${p.id}`} className="text-[#D9714A] hover:underline">Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
