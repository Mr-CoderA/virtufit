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

  if (!data) return <p className="text-[#A09E97]">Loading…</p>;

  const pieData = [
    { name: 'Nano', value: data.tierDistribution?.nano ?? 0, color: '#65635D' },
    { name: 'Basic', value: data.tierDistribution?.basic ?? 0, color: '#D9714A' },
    { name: 'Pro', value: data.tierDistribution?.pro ?? 0, color: '#8B7355' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['7', '30', '90'].map((d) => (
          <button key={d} type="button" onClick={() => setRange(d)} className={`rounded-lg px-4 py-2 text-[13px] ${range === d ? 'bg-[#D9714A] text-[#1A1915]' : 'bg-[#222219] text-[#A09E97] border border-[rgba(240,239,232,0.08)]'}`}>
            Last {d} days
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Daily generations by tier</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.dailyGenerations ?? []}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#65635D" />
            <YAxis tick={{ fontSize: 10 }} stroke="#65635D" />
            <Tooltip />
            <Bar dataKey="nano" stackId="a" fill="#65635D" />
            <Bar dataKey="basic" stackId="a" fill="#D9714A" />
            <Bar dataKey="pro" stackId="a" fill="#8B7355" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Revenue over time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.revenueOverTime ?? []}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#65635D" />
            <YAxis tick={{ fontSize: 10 }} stroke="#65635D" />
            <Tooltip />
            <Line type="monotone" dataKey="cumulative" stroke="#D9714A" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Tier distribution</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label><Cell fill="#65635D" /><Cell fill="#D9714A" /><Cell fill="#8B7355" /></Pie></PieChart>
          </ResponsiveContainer>
        ) : <p className="text-[#65635D] text-[13px]">No data</p>}
      </div>
    </div>
  );
}
