'use client';

import { useEffect, useState } from 'react';
import { brandFetch } from '@/lib/brand-api';

type TopUpItem = {
  id: string;
  credits: number;
  amountCents: number;
  amountDollars: string;
  createdAt: string;
};

export function DashboardTopUpHistory() {
  const [list, setList] = useState<TopUpItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandFetch('/api/topup/history')
      .then((res) => (res.ok ? res.json() : { topUps: [] }))
      .then((data: { topUps?: TopUpItem[] }) => setList(Array.isArray(data.topUps) ? data.topUps : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-[14px] text-[#65635D]">
        Loading…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center py-8 text-[14px] text-[#65635D]">
        No top-ups yet. Add credits from the Top up button above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[rgba(240,239,232,0.08)]">
            <th className="pb-3 pr-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[#65635D]">
              Date
            </th>
            <th className="pb-3 pr-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[#65635D]">
              Amount
            </th>
            <th className="pb-3 text-[11px] font-normal uppercase tracking-[0.1em] text-[#65635D]">
              Credits
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[rgba(240,239,232,0.06)] last:border-0"
            >
              <td className="py-3 pr-4 text-[14px] text-[#A09E97]">
                {new Date(row.createdAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </td>
              <td className="py-3 pr-4 text-[14px] text-[#F0EFE8]">
                ${row.amountDollars}
              </td>
              <td className="py-3 text-[14px] text-[#F0EFE8]">
                +{row.credits}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
