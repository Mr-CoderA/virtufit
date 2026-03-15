'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

type Plan = { id: string; name: string; key: string; welcomeCredits: number | null; features: string[]; contactEmail: string | null; description: string | null; updatedAt: string };

export default function AdminPlanEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminFetch<{ plan: Plan }>(`/plans/${id}`).then((r) => {
      if (r.data?.plan) setPlan(r.data.plan);
      setLoading(false);
    });
  }, [id]);

  const save = () => {
    if (!plan) return;
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    fetch(`/api/admin/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(plan),
    })
      .then(() => setSaving(false));
  };

  if (loading || !plan) return <p className="text-[#A09E97]">Loading…</p>;

  const features: string[] = Array.isArray(plan.features) ? (plan.features as string[]) : [];

  return (
    <div className="space-y-6">
      <Link href="/admin/plans" className="text-[#D9714A] hover:underline text-[13px]">← Back to plans</Link>
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <p className="text-[12px] text-[#65635D] mb-2">Last updated {new Date(plan.updatedAt).toLocaleString()}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-[#A09E97] mb-1">Name</label>
            <input value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" />
          </div>
          {plan.key === 'FREE' && (
            <div>
              <label className="block text-[12px] text-[#A09E97] mb-1">Welcome credits</label>
              <input type="number" value={plan.welcomeCredits ?? ''} onChange={(e) => setPlan({ ...plan, welcomeCredits: e.target.value ? parseInt(e.target.value, 10) : null })} className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8] w-24" />
            </div>
          )}
          {(plan.key === 'ENTERPRISE') && (
            <>
              <div>
                <label className="block text-[12px] text-[#A09E97] mb-1">Contact email</label>
                <input type="email" value={plan.contactEmail ?? ''} onChange={(e) => setPlan({ ...plan, contactEmail: e.target.value || null })} className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#A09E97] mb-1">Description</label>
                <textarea value={plan.description ?? ''} onChange={(e) => setPlan({ ...plan, description: e.target.value || null })} className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" rows={3} />
              </div>
            </>
          )}
          <div>
            <label className="block text-[12px] text-[#A09E97] mb-1">Features</label>
            {features.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={f} onChange={(e) => setPlan({ ...plan, features: features.map((x, j) => (j === i ? e.target.value : x)) })} className="flex-1 rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" />
                <button type="button" onClick={() => setPlan({ ...plan, features: features.filter((_, j) => j !== i) })} className="text-[#e0a0a0] hover:underline">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setPlan({ ...plan, features: [...features, ''] })} className="text-[#D9714A] hover:underline text-[13px]">Add feature</button>
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-lg bg-[#D9714A] text-[#1A1915] px-4 py-2 text-[13px] font-medium disabled:opacity-50">Save</button>
      </div>
    </div>
  );
}
