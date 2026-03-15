import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin: _admin } = auth;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBrands,
    generationsToday,
    generationsThisMonth,
    topUpsThisMonth,
    allUsersWithCredits,
    usageByUserThisMonth,
    recentUsageLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.usageLog.count({ where: { createdAt: { gte: todayStart }, tier: { in: ['nano', 'basic', 'pro'] } } }),
    prisma.usageLog.count({ where: { createdAt: { gte: monthStart }, tier: { in: ['nano', 'basic', 'pro'] } } }),
    prisma.topUp.findMany({ where: { createdAt: { gte: monthStart } }, select: { amountCents: true } }),
    prisma.user.findMany({ where: { isDeleted: false }, select: { id: true, credits: true } }),
    prisma.usageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart }, tier: { in: ['nano', 'basic', 'pro'] } },
      _count: { id: true },
    }),
    prisma.usageLog.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { userId: true },
    }),
  ]);

  const activeUserIdsToday = new Set(recentUsageLogs.map((u) => u.userId));
  const activeBrandsToday = activeUserIdsToday.size;

  const revenueThisMonthCents = topUpsThisMonth.reduce((s, t) => s + t.amountCents, 0);
  const revenueThisMonth = revenueThisMonthCents / 100;

  const creditBuckets = { '0': 0, '1-10': 0, '11-50': 0, '51-200': 0, '200+': 0 };
  for (const u of allUsersWithCredits) {
    if (u.credits === 0) creditBuckets['0']++;
    else if (u.credits <= 10) creditBuckets['1-10']++;
    else if (u.credits <= 50) creditBuckets['11-50']++;
    else if (u.credits <= 200) creditBuckets['51-200']++;
    else creditBuckets['200+']++;
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLogs = await prisma.usageLog.findMany({
    where: { createdAt: { gte: thirtyDaysAgo }, tier: { in: ['nano', 'basic', 'pro'] } },
    select: { createdAt: true },
  });

  const byDay: Record<string, number> = {};
  for (let d = 0; d < 30; d++) {
    const day = new Date(thirtyDaysAgo);
    day.setDate(day.getDate() + d);
    const key = day.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  for (const g of recentLogs) {
    const key = new Date(g.createdAt).toISOString().slice(0, 10);
    if (byDay[key] !== undefined) byDay[key]++;
  }
  const dailyGenerationsChart = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const topUserIds = usageByUserThisMonth
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 10)
    .map((u) => u.userId);
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds }, isDeleted: false },
    select: { id: true, name: true, email: true, credits: true, createdAt: true },
  });
  const usageMap = Object.fromEntries(usageByUserThisMonth.map((u) => [u.userId, u._count.id]));
  const topBrands = topUserIds
    .map((id) => {
      const user = topUsers.find((u) => u.id === id);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        generationsThisMonth: usageMap[user.id] ?? 0,
        creditsRemaining: user.credits,
        plan: 'FREE',
        joinedAt: user.createdAt,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string | null;
    email: string;
    generationsThisMonth: number;
    creditsRemaining: number;
    plan: string;
    joinedAt: Date;
  }>;

  const brandsWithZeroCredits = allUsersWithCredits.filter((u) => u.credits === 0).length;

  return NextResponse.json({
    totalBrands,
    activeBrandsToday,
    generationsToday,
    generationsThisMonth,
    revenueThisMonth,
    creditDistribution: creditBuckets,
    dailyGenerationsChart,
    topBrands,
    alerts: {
      brandsWithZeroCredits,
      failedGenerationsLast24h: 0,
      failedGenerationsRate24h: 0,
      replicateErrorsLastHour: 0,
    },
  });
}
