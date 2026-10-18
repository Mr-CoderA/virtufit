'use client';

import { useEffect, useState } from 'react';
import { brandFetch } from '@/lib/brand-api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type DayDatum = { date: string; calls: number; credits: number };

export function DashboardUsageChart() {
  const [data, setData] = useState<DayDatum[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandFetch('/api/usage')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: DayDatum[] }) => {
        setData(Array.isArray(json.data) && json.data.length > 0 ? json.data : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[200px] w-full items-center justify-center text-[14px] text-[var(--vf-quiet)]">
        Loading usage…
      </div>
    );
  }

  if (!data || data.length === 0 || data.every((d) => d.calls === 0 && d.credits === 0)) {
    return (
      <div className="flex min-h-[200px] w-full items-center justify-center py-12 text-[14px] text-[var(--vf-quiet)]">
        No API calls in the last 7 days.
      </div>
    );
  }

  return (
    <div className="h-[200px] min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,43,67,0.14)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--vf-quiet)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--vf-quiet)', fontSize: 11 }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--vf-surface)',
              border: '0.5px solid rgba(21,43,67,0.14)',
              borderRadius: '16px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'var(--vf-muted)', fontSize: 11 }}
            itemStyle={{ color: 'var(--vf-ink)', fontSize: 13 }}
            formatter={(value: unknown) => [String(value ?? 0), 'API calls']}
          />
          <Area
            type="monotone"
            dataKey="calls"
            stroke="var(--vf-accent)"
            strokeWidth={2}
            fill="var(--vf-accent)"
            fillOpacity={0.12}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
