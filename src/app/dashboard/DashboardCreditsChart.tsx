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

export function DashboardCreditsChart() {
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
      <div className="flex min-h-[200px] w-full items-center justify-center text-[14px] text-[#65635D]">
        Loading…
      </div>
    );
  }

  if (!data || data.length === 0 || data.every((d) => d.credits === 0)) {
    return (
      <div className="flex min-h-[200px] w-full items-center justify-center py-12 text-[14px] text-[#65635D]">
        No credits used in the last 7 days.
      </div>
    );
  }

  return (
    <div className="h-[200px] min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,239,232,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#65635D', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#65635D', fontSize: 11 }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#222219',
              border: '0.5px solid rgba(240,239,232,0.08)',
              borderRadius: '16px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#A09E97', fontSize: 11 }}
            itemStyle={{ color: '#F0EFE8', fontSize: 13 }}
            formatter={(value: unknown) => [String(value ?? 0), 'Credits used']}
          />
          <Area
            type="monotone"
            dataKey="credits"
            stroke="#A09E97"
            strokeWidth={2}
            fill="#A09E97"
            fillOpacity={0.15}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
