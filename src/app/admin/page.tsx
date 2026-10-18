'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/api/adminApi';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

type Stats = Awaited<ReturnType<typeof adminApi.stats>>['data'];

const BUCKET_COLORS = ['var(--vf-quiet)', 'var(--vf-accent)', '#8B7355', 'var(--vf-muted)', 'var(--vf-muted)'];

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
        <p className="text-[var(--vf-muted)]">Loading…</p>
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
          <ul className="text-[13px] text-[var(--vf-muted)] space-y-1">
            {stats.alerts.brandsWithZeroCredits > 0 && (
              <li>
                <Link href="/admin/credits" className="text-[var(--vf-accent)] hover:underline">
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
        <div className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-5 transition-colors hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[20px] font-normal text-[var(--vf-ink)] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Credit balance distribution</h3>
          <p className="text-[13px] text-[var(--vf-muted)] mb-4">Brands by credit bucket.</p>
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
            <p className="text-[13px] text-[var(--vf-quiet)]">No data</p>
          )}
        </div>

        <div className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-5 lg:col-span-2 transition-colors hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]" style={{ borderWidth: '0.5px' }}>
          <h3 className="text-[20px] font-normal text-[var(--vf-ink)] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Generation volume (last 30 days)</h3>
          <p className="text-[13px] text-[var(--vf-muted)] mb-4">Daily generation counts.</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.dailyGenerationsChart}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--vf-quiet)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--vf-quiet)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--vf-surface)', border: '1px solid rgba(21,43,67,0.14)' }} />
              <Line type="monotone" dataKey="count" stroke="var(--vf-accent)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(21,43,67,0.14)' }}>
        <h3 className="text-[20px] font-normal text-[var(--vf-ink)] p-5 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Top 10 brands by usage</h3>
        <p className="text-[13px] text-[var(--vf-muted)] px-5 mb-4">Most active brands in the last 30 days.</p>
        {stats.topBrands.length === 0 ? (
          <p className="p-6 text-[var(--vf-quiet)] text-[14px] text-center">No brands yet.</p>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-[var(--vf-surface)] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(21,43,67,0.14)' }}>
              <table className="w-full min-w-[600px] border-collapse bg-[var(--vf-surface)]">
                <thead>
                  <tr className="border-b border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)]" style={{ borderBottomWidth: '0.5px' }}>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vf-quiet)] text-left whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vf-quiet)] text-left whitespace-nowrap">Email</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vf-quiet)] text-left whitespace-nowrap">Generations (30d)</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vf-quiet)] text-left whitespace-nowrap">Credits left</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vf-quiet)] text-left whitespace-nowrap">Plan</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vf-quiet)] text-left whitespace-nowrap">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topBrands.map((b) => (
                    <tr key={b.id} className="border-b border-[rgba(21,43,67,0.14)] transition-colors hover:bg-[var(--vf-surface-hover)]" style={{ borderBottomWidth: '0.5px' }}>
                      <td className="py-3.5 px-4 text-[13px] text-[var(--vf-ink)] font-medium whitespace-nowrap">
                        <Link href={`/admin/brands/${b.id}`} className="text-[var(--vf-accent)] hover:underline">
                          {b.name ?? b.email}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-[var(--vf-muted)] whitespace-nowrap">{b.email}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[var(--vf-muted)] whitespace-nowrap">{b.generationsThisMonth}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[var(--vf-muted)] whitespace-nowrap">{b.creditsRemaining}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[var(--vf-muted)] whitespace-nowrap">{b.plan}</td>
                      <td className="py-3.5 px-4 text-[13px] text-[var(--vf-muted)] whitespace-nowrap">{new Date(b.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="md:hidden text-center text-[11px] text-[var(--vf-quiet)] mt-2">← Scroll to see more →</p>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-5 transition-colors hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]" style={{ borderWidth: '0.5px' }}>
      <p className="text-[12px] text-[var(--vf-quiet)] uppercase tracking-[0.08em] mb-1">{title}</p>
      <p className="text-[32px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>{value}</p>
    </div>
  );
}
