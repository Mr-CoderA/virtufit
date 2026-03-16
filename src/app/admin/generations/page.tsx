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
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Generations</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">Queue status and completed generations.</p>
      {queueStats != null && (
        <div className="flex flex-wrap gap-4 p-5 rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] transition-colors hover:bg-[#2C2C27]" style={{ borderWidth: '0.5px' }}>
          <span className="text-[13px] text-[#A09E97]">
            Queued: <strong className="text-[#F0EFE8]">{queueStats.queued}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Processing: <strong className="text-[#D9714A]">{queueStats.processing}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Completed today: <strong className="text-[#D9714A]">{queueStats.completedToday}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Failed today: <strong className="text-[#E24B4A]">{queueStats.failedToday}</strong>
          </span>
          <span className="text-[13px] text-[#A09E97]">
            Workers active: <strong className="text-[#F0EFE8]">{queueStats.workersActive}</strong>
          </span>
        </div>
      )}

      {activeJobs.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
          <h3 className="text-[20px] font-normal text-[#F0EFE8] p-5 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Current queue</h3>
          <p className="text-[13px] text-[#A09E97] px-5 mb-4">Jobs in queue or processing.</p>
          <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
            <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
              <thead>
                <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                  <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Queued</th>
                  <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Brand</th>
                  <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Tier</th>
                  <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Job ID</th>
                  <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((j) => (
                  <tr key={j.id} className="border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27]" style={{ borderBottomWidth: '0.5px' }}>
                    <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(j.queuedAt).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">{j.brand}</td>
                    <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{j.tier}</td>
                    <td className="py-3.5 px-4 text-[13px] text-[#A09E97] font-mono text-[11px] whitespace-nowrap">{j.id.slice(0, 8)}…</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {j.status === 'queued' ? (
                        <span className="inline-flex items-center gap-1 text-[#A09E97]"><Clock className="h-3.5 w-3" /> Queued</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#D9714A]"><Loader2 className="h-3.5 w-3 animate-spin" /> Processing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        <h3 className="text-[20px] font-normal text-[#F0EFE8] p-5 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Generations (completed)</h3>
        <p className="text-[13px] text-[#A09E97] px-5 mb-4">Recent completed generations.</p>
        {loading ? (
          <p className="p-6 text-[#A09E97] text-[14px]">Loading…</p>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
              <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
                <thead>
                  <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Time</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Brand</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Tier</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Job ID</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Output</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((g) => (
                    <tr key={g.id} className="border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27]" style={{ borderBottomWidth: '0.5px' }}>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(g.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">{g.brand}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{g.tier}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] font-mono text-[11px] whitespace-nowrap">{g.jobId ?? '—'}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap"><span className="text-[#D9714A]">Success</span></td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{g.outputUrl ? <img src={g.outputUrl} alt="" className="w-12 h-12 object-cover rounded" /> : '—'}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] whitespace-nowrap">{g.creditsUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
          </>
        )}
        <div className="flex justify-between p-4 border-t border-[rgba(240,239,232,0.08)] bg-[#222219]">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] disabled:opacity-50">Previous</button>
          <button type="button" onClick={() => setPage((p) => p + 1)} className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)]">Next</button>
        </div>
      </div>
    </div>
  );
}
