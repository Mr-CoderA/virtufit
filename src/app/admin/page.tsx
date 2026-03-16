'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/api/adminApi';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

type Stats = Awaited<ReturnType<typeof adminApi.stats>>['data'];

const BUCKET_COLORS = ['#65635D', '#D9714A', '#8B7355', '#A09E97', '#A09E97'];

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
        <div className="rounded-2xl border border-[rgba(226,75,74,0.3)] bg-[rgba(226,75,74,0.08)] p-5" style={{ borderWidth: '0.5px' }}>
          <h2 className="text-[14px] font-medium text-[#E24B4A] mb-2">Alerts</h2>
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
        <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Credit balance distribution</h3>
          <p className="text-[13px] text-[#A09E97] mb-4">Brands by credit bucket.</p>
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

        <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 lg:col-span-2 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Generation volume (last 30 days)</h3>
          <p className="text-[13px] text-[#A09E97] mb-4">Daily generation counts.</p>
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

      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        <h3 className="text-[20px] font-normal text-[#F0EFE8] p-5 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Top 10 brands by usage</h3>
        <p className="text-[13px] text-[#A09E97] px-5 mb-4">Most active brands in the last 30 days.</p>
        {stats.topBrands.length === 0 ? (
          <p className="p-6 text-[#65635D] text-[14px] text-center">No brands yet.</p>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
              <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
                <thead>
                  <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Email</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Generations (30d)</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Credits left</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Plan</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topBrands.map((b) => (
                    <tr key={b.id} className="border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27]" style={{ borderBottomWidth: '0.5px' }}>
                      <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">
                        <Link href={`/admin/brands/${b.id}`} className="text-[#D9714A] hover:underline">
                          {b.name ?? b.email}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.email}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.generationsThisMonth}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.creditsRemaining}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{b.plan}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(b.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5 transition-colors hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
      <p className="text-[12px] text-[#65635D] uppercase tracking-[0.08em] mb-1">{title}</p>
      <p className="text-[32px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{value}</p>
    </div>
  );
}
