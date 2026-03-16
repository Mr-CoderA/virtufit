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
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Brands</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">Manage brand accounts and view usage.</p>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Search by name, email, or API key prefix..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-[280px] rounded-lg border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] px-3.5 py-2 text-[13px] text-[#F0EFE8] placeholder:text-[#65635D] focus:border-[rgba(240,239,232,0.3)] outline-none"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] px-3.5 py-2 text-[13px] text-[#F0EFE8] outline-none focus:border-[rgba(240,239,232,0.3)]">
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] px-3.5 py-2 text-[13px] text-[#F0EFE8] outline-none focus:border-[rgba(240,239,232,0.3)]">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_credits">Most credits</option>
        </select>
        <label className="flex items-center gap-2 text-[13px] text-[#A09E97] cursor-pointer">
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="rounded border-[rgba(240,239,232,0.3)] accent-[#D9714A]" />
          Show deleted accounts
        </label>
        <button type="button" onClick={exportCsv} className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] font-medium text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors">
          Export CSV
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        {loading ? (
          <p className="p-6 text-[#A09E97] text-[14px]">Loading…</p>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
              <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
                <thead>
                  <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left w-10 whitespace-nowrap">#</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Email</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Plan</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Credits</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Generations (30d)</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Joined</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Last active</th>
                    {showDeleted && (
                      <>
                        <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Deleted</th>
                        <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Deleted by</th>
                        <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Reason</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((b, i) => (
                    <tr
                      key={b.id}
                      className={`border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27] ${b.isDeleted ? 'bg-[rgba(226,75,74,0.06)]' : ''}`}
                      style={{ borderBottomWidth: '0.5px' }}
                    >
                      <td className="py-3.5 px-4 text-[13px] text-[#65635D] w-10 whitespace-nowrap">{(page - 1) * 20 + i + 1}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">{b.name}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.email}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[12px] ${b.plan === 'ENTERPRISE' ? 'bg-[rgba(217,113,74,0.1)] text-[#D9714A]' : 'bg-[rgba(160,158,151,0.1)] text-[#A09E97]'}`}>
                          {b.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.credits}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.generations30d}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(b.joinedAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.lastActive ? new Date(b.lastActive).toLocaleString() : '—'}</td>
                      {showDeleted && (
                        <>
                          <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.deletedAt ? new Date(b.deletedAt).toLocaleString() : '—'}</td>
                          <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.deletedBy ?? '—'}</td>
                          <td className="py-3.5 px-4 text-[13px] text-[#A09E97] max-w-[180px] truncate whitespace-nowrap" title={b.deletedReason ?? undefined}>{b.deletedReason ?? '—'}</td>
                        </>
                      )}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {b.isDeleted ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(b.id)}
                            disabled={restoringId === b.id}
                            className="text-[#D9714A] hover:underline font-medium disabled:opacity-50 text-[13px]"
                          >
                            {restoringId === b.id ? 'Restoring…' : 'Restore'}
                          </button>
                        ) : (
                          <Link href={`/admin/brands/${b.id}`} className="inline-flex rounded-full border border-[rgba(240,239,232,0.14)] px-3 py-1 text-[12px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
          </>
        )}
        {total > 20 && (
          <div className="flex items-center justify-between p-4 border-t border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderTopWidth: '0.5px' }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] disabled:opacity-50">Previous</button>
            <span className="text-[#A09E97] text-[13px]">Page {page} of {Math.ceil(total / 20)}</span>
            <button type="button" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
