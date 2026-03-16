'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/api/adminApi';

type Brand = {
  id: string; name: string; email: string; plan: string; credits: number; generations30d: number; joinedAt: string; lastActive: string | null; suspended: boolean;
  isDeleted?: boolean; deletedAt?: string | null; deletedBy?: string | null; deletedReason?: string | null;
};

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T; status: number }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  }).then(async (r) => ({ data: (await r.json()) as T, status: r.status }));
}

export default function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBrands = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', search: debouncedSearch, status, sort });
    if (showDeleted) params.set('showDeleted', 'true');
    adminFetch<{ items: Brand[]; total: number }>(`/brands?${params}`).then((r) => {
      if (r.data?.items) setItems(r.data.items);
      if (r.data?.total != null) setTotal(r.data.total);
      setLoading(false);
    });
  }, [page, debouncedSearch, status, sort, showDeleted]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleRestore = (brandId: string) => {
    setRestoringId(brandId);
    const token = localStorage.getItem('adminToken');
    fetch(`/api/admin/brands/${brandId}/restore`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then((r) => r.json())
      .then(() => { setRestoringId(null); fetchBrands(); })
      .catch(() => setRestoringId(null));
  };

  const exportCsv = () => {
    const token = localStorage.getItem('adminToken');
    fetch('/api/admin/brands/export', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.text())
      .then((csv) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'virtufit-brands.csv';
        a.click();
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Search by name, email, or API key prefix..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#222219] px-3 py-2 text-[14px] text-[#F0EFE8] placeholder:text-[#65635D]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#222219] px-3 py-2 text-[14px] text-[#F0EFE8]">
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#222219] px-3 py-2 text-[14px] text-[#F0EFE8]">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_credits">Most credits</option>
        </select>
        <label className="flex items-center gap-2 text-[13px] text-[#A09E97] cursor-pointer">
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="rounded border-[rgba(240,239,232,0.3)]" />
          Show deleted accounts
        </label>
        <button type="button" onClick={exportCsv} className="rounded-lg bg-[#222219] border border-[rgba(240,239,232,0.12)] px-4 py-2 text-[13px] text-[#F0EFE8] hover:bg-[#2C2C27]">
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        {loading ? (
          <p className="p-6 text-[#A09E97]">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[700px]">
            <thead>
              <tr className="text-left text-[#65635D] border-b border-[rgba(240,239,232,0.08)]">
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Credits</th>
                <th className="p-3 font-medium">Generations (30d)</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium">Last active</th>
                {showDeleted && (
                  <>
                    <th className="p-3 font-medium">Deleted</th>
                    <th className="p-3 font-medium">Deleted by</th>
                    <th className="p-3 font-medium">Reason</th>
                  </>
                )}
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b, i) => (
                <tr
                  key={b.id}
                  className={`border-b border-[rgba(240,239,232,0.06)] ${b.isDeleted ? 'bg-[rgba(226,75,74,0.06)]' : ''}`}
                >
                  <td className="p-3 text-[#A09E97]">{(page - 1) * 20 + i + 1}</td>
                  <td className="p-3 text-[#F0EFE8]">{b.name}</td>
                  <td className="p-3 text-[#A09E97]">{b.email}</td>
                  <td className="p-3 text-[#A09E97]">{b.plan}</td>
                  <td className="p-3 text-[#F0EFE8]">{b.credits}</td>
                  <td className="p-3 text-[#F0EFE8]">{b.generations30d}</td>
                  <td className="p-3 text-[#A09E97]">{new Date(b.joinedAt).toLocaleDateString()}</td>
                  <td className="p-3 text-[#A09E97]">{b.lastActive ? new Date(b.lastActive).toLocaleString() : '—'}</td>
                  {showDeleted && (
                    <>
                      <td className="p-3 text-[#A09E97]">{b.deletedAt ? new Date(b.deletedAt).toLocaleString() : '—'}</td>
                      <td className="p-3 text-[#A09E97]">{b.deletedBy ?? '—'}</td>
                      <td className="p-3 text-[#A09E97] max-w-[180px] truncate" title={b.deletedReason ?? undefined}>{b.deletedReason ?? '—'}</td>
                    </>
                  )}
                  <td className="p-3">
                    {b.isDeleted ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(b.id)}
                        disabled={restoringId === b.id}
                        className="text-[#2d8a2d] hover:underline font-medium disabled:opacity-50"
                      >
                        {restoringId === b.id ? 'Restoring…' : 'Restore'}
                      </button>
                    ) : (
                      <Link href={`/admin/brands/${b.id}`} className="text-[#D9714A] hover:underline mr-2">View</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-between p-3 border-t border-[rgba(240,239,232,0.08)]">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-[#D9714A] disabled:opacity-50">Previous</button>
            <span className="text-[#A09E97] text-[13px]">Page {page} of {Math.ceil(total / 20)}</span>
            <button type="button" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="text-[#D9714A] disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
