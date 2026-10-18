'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

function adminFetch<T>(path: string): Promise<{ data?: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json().then((d) => ({ data: d as T })));
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30');
  const [data, setData] = useState<{
    dailyGenerations: Array<{ date: string; nano: number; basic: number; pro: number; total: number }>;
    revenueOverTime: Array<{ date: string; cumulative: number }>;
    tierDistribution: { nano: number; basic: number; pro: number };
  } | null>(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - parseInt(range, 10));
    adminFetch<typeof data>(`/analytics?dateFrom=${from.toISOString().slice(0, 10)}&dateTo=${to.toISOString().slice(0, 10)}`).then((r) => r.data && setData(r.data));
  }, [range]);

  if (!data) return <p className="text-[var(--vf-muted)]">Loading…</p>;

  const pieData = [
    { name: 'Nano', value: data.tierDistribution?.nano ?? 0, color: 'var(--vf-quiet)' },
    { name: 'Basic', value: data.tierDistribution?.basic ?? 0, color: 'var(--vf-accent)' },
    { name: 'Pro', value: data.tierDistribution?.pro ?? 0, color: '#8B7355' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['7', '30', '90'].map((d) => (
          <button key={d} type="button" onClick={() => setRange(d)} className={`rounded-lg px-4 py-2 text-[13px] ${range === d ? 'bg-[var(--vf-accent)] text-[var(--vf-page)]' : 'bg-[var(--vf-surface)] text-[var(--vf-muted)] border border-[rgba(21,43,67,0.14)]'}`}>
            Last {d} days
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[var(--vf-ink)] mb-4">Daily generations by tier</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.dailyGenerations ?? []}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--vf-quiet)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--vf-quiet)" />
            <Tooltip />
            <Bar dataKey="nano" stackId="a" fill="var(--vf-quiet)" />
            <Bar dataKey="basic" stackId="a" fill="var(--vf-accent)" />
            <Bar dataKey="pro" stackId="a" fill="#8B7355" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[var(--vf-ink)] mb-4">Revenue over time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.revenueOverTime ?? []}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--vf-quiet)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--vf-quiet)" />
            <Tooltip />
            <Line type="monotone" dataKey="cumulative" stroke="var(--vf-accent)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[var(--vf-ink)] mb-4">Tier distribution</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label><Cell fill="var(--vf-quiet)" /><Cell fill="var(--vf-accent)" /><Cell fill="#8B7355" /></Pie></PieChart>
          </ResponsiveContainer>
        ) : <p className="text-[var(--vf-quiet)] text-[13px]">No data</p>}
      </div>
    </div>
  );
}
