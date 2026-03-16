'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/api/adminApi';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

type Stats = Awaited<ReturnType<typeof adminApi.stats>>['data'];

const BUCKET_COLORS = ['#65635D', '#D9714A', '#8B7355', '#A09E97', '#2d8a2d'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then((r) => {
      if (r.data) setStats(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-[#A09E97]">Loading…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-[#e0a0a0]">Failed to load dashboard stats.</div>
    );
  }

  const hasAlerts = stats.alerts.brandsWithZeroCredits > 0 || stats.alerts.failedGenerationsLast24h > 0 || stats.alerts.replicateErrorsLastHour > 0;

  const pieData = [
    { name: '0', value: stats.creditDistribution['0'] ?? 0 },
    { name: '1-10', value: stats.creditDistribution['1-10'] ?? 0 },
    { name: '11-50', value: stats.creditDistribution['11-50'] ?? 0 },
    { name: '51-200', value: stats.creditDistribution['51-200'] ?? 0 },
    { name: '200+', value: stats.creditDistribution['200+'] ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {hasAlerts && (
        <div className="rounded-xl border border-[rgba(179,45,46,0.3)] bg-[rgba(179,45,46,0.08)] p-4">
          <h2 className="text-[14px] font-medium text-[#e0a0a0] mb-2">Alerts</h2>
          <ul className="text-[13px] text-[#A09E97] space-y-1">
            {stats.alerts.brandsWithZeroCredits > 0 && (
              <li>
                <Link href="/admin/credits" className="text-[#D9714A] hover:underline">
                  {stats.alerts.brandsWithZeroCredits} brand(s) with 0 credits
                </Link>
              </li>
            )}
            {stats.alerts.failedGenerationsLast24h > 0 && (
              <li>Failed generations in last 24h: {stats.alerts.failedGenerationsLast24h} (rate: {(stats.alerts.failedGenerationsRate24h * 100).toFixed(1)}%)</li>
            )}
            {stats.alerts.replicateErrorsLastHour > 0 && (
              <li>Replicate API errors in last hour: {stats.alerts.replicateErrorsLastHour}</li>
            )}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Total brands" value={stats.totalBrands} />
        <Card title="Active brands today" value={stats.activeBrandsToday} />
        <Card title="Generations today" value={stats.generationsToday} />
        <Card title="Generations this month" value={stats.generationsThisMonth} />
        <Card title="Revenue this month" value={`$${stats.revenueThisMonth.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Credit balance distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[13px] text-[#65635D]">No data</p>
          )}
        </div>

        <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 lg:col-span-2" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Generation volume (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.dailyGenerationsChart}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#65635D" />
              <YAxis tick={{ fontSize: 10 }} stroke="#65635D" />
              <Tooltip contentStyle={{ backgroundColor: '#222219', border: '1px solid rgba(240,239,232,0.08)' }} />
              <Line type="monotone" dataKey="count" stroke="#D9714A" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] p-4 border-b border-[rgba(240,239,232,0.08)]">Top 10 brands by usage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[500px]">
            <thead>
              <tr className="text-left text-[#65635D] border-b border-[rgba(240,239,232,0.08)]">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Generations (30d)</th>
                <th className="p-3 font-medium">Credits left</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.topBrands.map((b) => (
                <tr key={b.id} className="border-b border-[rgba(240,239,232,0.06)] hover:bg-[rgba(240,239,232,0.03)]">
                  <td className="p-3">
                    <Link href={`/admin/brands/${b.id}`} className="text-[#D9714A] hover:underline">
                      {b.name ?? b.email}
                    </Link>
                  </td>
                  <td className="p-3 text-[#A09E97]">{b.email}</td>
                  <td className="p-3 text-[#F0EFE8]">{b.generationsThisMonth}</td>
                  <td className="p-3 text-[#F0EFE8]">{b.creditsRemaining}</td>
                  <td className="p-3 text-[#A09E97]">{b.plan}</td>
                  <td className="p-3 text-[#A09E97]">{new Date(b.joinedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stats.topBrands.length === 0 && (
          <p className="p-4 text-[#65635D] text-[13px]">No brands yet.</p>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4" style={{ borderWidth: '0.5px' }}>
      <p className="text-[12px] text-[#65635D] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-[24px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{value}</p>
    </div>
  );
}
