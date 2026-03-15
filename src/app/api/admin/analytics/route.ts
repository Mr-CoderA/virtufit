import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateTo = searchParams.get('dateTo') || new Date().toISOString().slice(0, 10);
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  const logs = await prisma.usageLog.findMany({
    where: { createdAt: { gte: from, lte: to }, tier: { in: ['nano', 'basic', 'pro'] } },
    select: { createdAt: true, tier: true, creditsUsed: true },
  });
  const topUps = await prisma.topUp.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { createdAt: true, credits: true, amountCents: true },
  });
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { createdAt: true },
  });

  const byDay: Record<string, { nano: number; basic: number; pro: number; revenue: number; brands: number }> = {};
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { nano: 0, basic: 0, pro: 0, revenue: 0, brands: 0 };
  }
  for (const l of logs) {
    const key = new Date(l.createdAt).toISOString().slice(0, 10);
    if (byDay[key]) {
      byDay[key][l.tier as 'nano' | 'basic' | 'pro']++;
    }
  }
  let cumulativeRevenue = 0;
  for (const t of topUps) {
    const key = new Date(t.createdAt).toISOString().slice(0, 10);
    if (byDay[key]) {
      byDay[key].revenue += t.amountCents / 100;
      cumulativeRevenue += t.amountCents / 100;
    }
  }
  const brandGrowth: Record<string, number> = {};
  for (const u of users) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    brandGrowth[key] = (brandGrowth[key] ?? 0) + 1;
  }
  for (const key of Object.keys(byDay)) {
    byDay[key].brands = brandGrowth[key] ?? 0;
  }

  const dailyGenerations = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v, total: v.nano + v.basic + v.pro }));
  const revenueOverTime = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<Array<{ date: string; cumulative: number }>>((acc, [date, v]) => {
      acc.push({ date, cumulative: (acc.length ? acc[acc.length - 1].cumulative : 0) + v.revenue });
      return acc;
    }, []);
  const brandGrowthChart = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map((date, i, arr) => ({
      date: date[0],
      cumulative: arr.slice(0, i + 1).reduce((s, [, v]) => s + (v.brands ?? 0), 0),
    }));

  const totalGen = logs.length;
  const successRate = totalGen > 0 ? 1 : 0;
  const tierDist = { nano: logs.filter((l) => l.tier === 'nano').length, basic: logs.filter((l) => l.tier === 'basic').length, pro: logs.filter((l) => l.tier === 'pro').length };

  return NextResponse.json({
    dailyGenerations,
    revenueOverTime,
    brandGrowthChart,
    successRateByDay: dailyGenerations.map((d) => ({ date: d.date, rate: d.total > 0 ? 1 : 0 })),
    creditConsumptionVsPurchase: dailyGenerations.map((d) => ({
      date: d.date,
      consumed: d.total,
      purchased: Math.round((byDay[d.date]?.revenue ?? 0) * 5),
    })),
    tierDistribution: tierDist,
    metrics: {
      avgGenerationsPerBrandPerDay: 0,
      avgRevenuePerBrand: 0,
      bestDay: [...dailyGenerations].sort((a, b) => b.total - a.total)[0]?.date ?? null,
      mostActiveBrandId: null,
    },
  });
}
