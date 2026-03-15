'use client';

import { useState, useEffect } from 'react';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

export default function AdminGenerationsPage() {
  const [items, setItems] = useState<Array<{ id: string; userId: string; tier: string; creditsUsed: number; jobId: string | null; outputUrl: string | null; createdAt: string; brand: string }>>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch<{ items: typeof items }>(`/generations?page=${page}&limit=20`).then((r) => {
      if (r.data?.items) setItems(r.data.items);
      setLoading(false);
    });
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] p-4 border-b border-[rgba(240,239,232,0.08)]">Generations</h3>
        {loading ? (
          <p className="p-6 text-[#A09E97]">Loading…</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[#65635D]"><th className="p-3">Time</th><th className="p-3">Brand</th><th className="p-3">Tier</th><th className="p-3">Job ID</th><th className="p-3">Status</th><th className="p-3">Output</th><th className="p-3">Credits</th></tr></thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id} className="border-t border-[rgba(240,239,232,0.06)]">
                  <td className="p-3 text-[#A09E97]">{new Date(g.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-[#F0EFE8]">{g.brand}</td>
                  <td className="p-3 text-[#A09E97]">{g.tier}</td>
                  <td className="p-3 text-[#A09E97] font-mono text-[11px]">{g.jobId ?? '—'}</td>
                  <td className="p-3"><span className="text-[#2d8a2d]">Success</span></td>
                  <td className="p-3">{g.outputUrl ? <img src={g.outputUrl} alt="" className="w-12 h-12 object-cover rounded" /> : '—'}</td>
                  <td className="p-3 text-[#F0EFE8]">{g.creditsUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-between p-3 border-t border-[rgba(240,239,232,0.08)]">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-[#D9714A] disabled:opacity-50">Previous</button>
          <button type="button" onClick={() => setPage((p) => p + 1)} className="text-[#D9714A]">Next</button>
        </div>
      </div>
    </div>
  );
}
