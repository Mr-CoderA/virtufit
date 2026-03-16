'use client';

import { useState, useEffect } from 'react';

function adminFetch<T>(path: string): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    .then((r) => r.json().then((d) => ({ data: d as T })));
}

type QueueStats = {
  queue: { waiting: number; active: number; completed: number; failed: number; paused: number };
  completedToday: number;
  failedToday: number;
  workersActive: number;
};

export default function AdminQueuesPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);

  function fetchStats() {
    adminFetch<QueueStats>('/queues/stats').then((r) => {
      if (r.data) setStats(r.data);
    });
  }

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 5000);
    return () => clearInterval(t);
  }, []);

  if (!stats) {
    return <p className="text-[#A09E97] text-[14px] py-12 text-center">Loading queue stats…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Queue monitor</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">
        Queue stats and job counts. Workers process jobs in the background.
      </p>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {[
          { label: 'Waiting', value: stats.queue.waiting, accent: false },
          { label: 'Active', value: stats.queue.active, accent: 'orange' },
          { label: 'Completed (total)', value: stats.queue.completed, accent: false },
          { label: 'Failed (total)', value: stats.queue.failed, accent: 'red' },
          { label: 'Workers active', value: stats.workersActive, accent: false },
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
        Completed today: {stats.completedToday} · Failed today: {stats.failedToday}
      </p>
    </div>
  );
}
