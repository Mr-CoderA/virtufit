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
    return <p className="text-[#A09E97]">Loading queue stats…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h2 className="text-[18px] font-medium text-[#F0EFE8] mb-4">Queue monitor</h2>
        <p className="text-[13px] text-[#A09E97] mb-6">
          Run the generation worker to process jobs: <code className="bg-[#1A1915] px-2 py-1 rounded text-[#D9714A]">npm run worker</code>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-[#1A1915] border border-[rgba(240,239,232,0.08)]">
            <div className="text-[11px] uppercase tracking-wider text-[#65635D]">Waiting</div>
            <div className="text-[24px] font-medium text-[#F0EFE8] mt-1">{stats.queue.waiting}</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1915] border border-[rgba(240,239,232,0.08)]">
            <div className="text-[11px] uppercase tracking-wider text-[#65635D]">Active</div>
            <div className="text-[24px] font-medium text-[#3b82f6] mt-1">{stats.queue.active}</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1915] border border-[rgba(240,239,232,0.08)]">
            <div className="text-[11px] uppercase tracking-wider text-[#65635D]">Completed (total)</div>
            <div className="text-[24px] font-medium text-[#2d8a2d] mt-1">{stats.queue.completed}</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1915] border border-[rgba(240,239,232,0.08)]">
            <div className="text-[11px] uppercase tracking-wider text-[#65635D]">Failed (total)</div>
            <div className="text-[24px] font-medium text-[#b32d2e] mt-1">{stats.queue.failed}</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1915] border border-[rgba(240,239,232,0.08)]">
            <div className="text-[11px] uppercase tracking-wider text-[#65635D]">Workers active</div>
            <div className="text-[24px] font-medium text-[#F0EFE8] mt-1">{stats.workersActive}</div>
          </div>
        </div>
        <p className="text-[12px] text-[#65635D] mt-4">
          Completed today: {stats.completedToday} · Failed today: {stats.failedToday}
        </p>
      </div>
    </div>
  );
}
