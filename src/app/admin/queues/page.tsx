'use client';

import { useState, useEffect } from 'react';

function adminFetch<T>(path: string, options?: RequestInit): Promise<{ data?: T; ok?: boolean }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  }).then((r) => r.json().then((d) => ({ data: d as T, ok: r.ok })));
}

type QueueStats = {
  queue: { waiting: number; active: number; completed: number; failed: number; paused: number };
  completedToday: number;
  failedToday: number;
  workersActive: number;
};

const DEFAULT_STATS: QueueStats = {
  queue: { waiting: 0, active: 0, completed: 0, failed: 0, paused: 0 },
  completedToday: 0,
  failedToday: 0,
  workersActive: 0,
};

function isQueueStats(d: unknown): d is QueueStats {
  return !!d && typeof d === 'object' && typeof (d as QueueStats).queue?.waiting === 'number';
}

export default function AdminQueuesPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  function fetchStats() {
    adminFetch<QueueStats>('/queues/stats').then((r) => {
      if (r.ok && isQueueStats(r.data)) {
        setStats(r.data);
        setRateLimited(false);
      } else if (!r.ok && (r.data as { error?: string })?.error) {
        setRateLimited(true);
        if (!stats) setStats(DEFAULT_STATS);
      } else if (stats === null) {
        setStats(DEFAULT_STATS);
      }
    });
  }

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 5000);
    return () => clearInterval(t);
  }, []);

  async function handleClearQueue() {
    setClearing(true);
    setClearMessage(null);
    const res = await adminFetch<{ cleared?: number; error?: string; message?: string }>('/queues/clear', { method: 'POST' });
    setClearing(false);
    if (res.ok && res.data && !('error' in res.data && res.data.error)) {
      setClearMessage(res.data.message ?? `Cleared ${res.data.cleared ?? 0} job(s).`);
      fetchStats();
    } else {
      setClearMessage((res.data as { error?: string })?.error ?? 'Failed to clear queue.');
    }
  }

  const safeStats = stats ?? DEFAULT_STATS;

  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Queue monitor</h2>
      {rateLimited && (
        <p className="text-[13px] text-[#E24B4A] mb-2">
          Too many requests — stats will refresh when the rate limit resets.
        </p>
      )}
      {!stats && (
        <p className="text-[#A09E97] text-[14px] mb-2">Loading queue stats…</p>
      )}
      <p className="text-[13px] text-[#A09E97] mb-2">
        Direct processing mode — generations run in the API request. No worker process. Use Clear queue to remove any stuck jobs.
      </p>
      {clearMessage && (
        <p className={`text-[13px] ${clearMessage.startsWith('Cleared') ? 'text-[#D9714A]' : 'text-[#E24B4A]'}`}>
          {clearMessage}
        </p>
      )}
      <div className="mb-2">
        <button
          type="button"
          onClick={handleClearQueue}
          disabled={clearing || (safeStats.queue.waiting === 0 && safeStats.queue.active === 0)}
          className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] font-medium text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {clearing ? 'Clearing…' : 'Clear queue'}
        </button>
      </div>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {[
          { label: 'Waiting', value: safeStats.queue.waiting, accent: false },
          { label: 'Active', value: safeStats.queue.active, accent: 'orange' },
          { label: 'Completed (total)', value: safeStats.queue.completed, accent: false },
          { label: 'Failed (total)', value: safeStats.queue.failed, accent: 'red' },
          { label: 'Workers active', value: safeStats.workersActive, accent: false },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] px-5 py-4"
            style={{ borderWidth: '0.5px' }}
          >
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#65635D]">{label}</div>
            <div
              className="font-serif text-[36px] font-normal leading-none"
              style={{
                fontFamily: 'Georgia, serif',
                color:
                  value === 0
                    ? '#A09E97'
                    : accent === 'orange'
                      ? '#D9714A'
                      : accent === 'red'
                        ? '#E24B4A'
                        : '#F0EFE8',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-[#65635D]">
        Completed today: {safeStats.completedToday} · Failed today: {safeStats.failedToday}
      </p>
    </div>
  );
}
