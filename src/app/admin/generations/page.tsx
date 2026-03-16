'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

type QueueStats = { queued: number; processing: number; completedToday: number; failedToday: number; workersActive: number };
type ActiveJob = { id: string; userId: string; tier: string; status: string; queuedAt: string; startedAt: string | null; brand: string };

export default function AdminGenerationsPage() {
  const [items, setItems] = useState<Array<{ id: string; userId: string; tier: string; creditsUsed: number; jobId: string | null; outputUrl: string | null; createdAt: string; brand: string }>>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function fetchGenerations() {
    setLoading(true);
    adminFetch<{
      items: typeof items;
      queueStats: QueueStats;
      activeJobs: ActiveJob[];
    }>(`/generations?page=${page}&limit=20`).then((r) => {
      if (r.data?.items) setItems(r.data.items);
      if (r.data?.queueStats) setQueueStats(r.data.queueStats);
      if (r.data?.activeJobs) setActiveJobs(r.data.activeJobs);
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchGenerations();
  }, [page]);

  useEffect(() => {
    const t = setInterval(fetchGenerations, 10000);
    return () => clearInterval(t);
  }, [page]);

  return (
    <div className="space-y-4">
      {queueStats != null && (
        <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderWidth: '0.5px' }}>
          <span className="text-[13px] text-[#A09E97]">
            Queued: <strong className="text-[#F0EFE8]">{queueStats.queued}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Processing: <strong className="text-[#F0EFE8]">{queueStats.processing}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Completed today: <strong className="text-[#2d8a2d]">{queueStats.completedToday}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Failed today: <strong className="text-[#b32d2e]">{queueStats.failedToday}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Workers active: <strong className="text-[#F0EFE8]">{queueStats.workersActive}</strong>
          </span>
        </div>
      )}

      {activeJobs.length > 0 && (
        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[14px] font-medium text-[#F0EFE8] p-4 border-b border-[rgba(240,239,232,0.08)]">Current queue</h3>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[500px]">
            <thead><tr className="text-left text-[#65635D]"><th className="p-3">Queued</th><th className="p-3">Brand</th><th className="p-3">Tier</th><th className="p-3">Job ID</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {activeJobs.map((j) => (
                <tr key={j.id} className="border-t border-[rgba(240,239,232,0.06)]">
                  <td className="p-3 text-[#A09E97]">{new Date(j.queuedAt).toLocaleString()}</td>
                  <td className="p-3 text-[#F0EFE8]">{j.brand}</td>
                  <td className="p-3 text-[#A09E97]">{j.tier}</td>
                  <td className="p-3 text-[#A09E97] font-mono text-[11px]">{j.id.slice(0, 8)}…</td>
                  <td className="p-3">
                    {j.status === 'queued' ? (
                      <span className="inline-flex items-center gap-1 text-[#A09E97]"><Clock className="h-3.5 w-3" /> Queued</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#3b82f6]"><Loader2 className="h-3.5 w-3 animate-spin" /> Processing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] p-4 border-b border-[rgba(240,239,232,0.08)]">Generations (completed)</h3>
        {loading ? (
          <p className="p-6 text-[#A09E97]">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[600px]">
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
          </div>
        )}
        <div className="flex justify-between p-3 border-t border-[rgba(240,239,232,0.08)]">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-[#D9714A] disabled:opacity-50">Previous</button>
          <button type="button" onClick={() => setPage((p) => p + 1)} className="text-[#D9714A]">Next</button>
        </div>
      </div>
    </div>
  );
}
