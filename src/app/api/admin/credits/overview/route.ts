import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalInCirculation, manualThisMonth, consumedThisMonth, purchasedThisMonth, creditRate] = await Promise.all([
    prisma.user.aggregate({ _sum: { credits: true } }).then((r) => r._sum.credits ?? 0),
    prisma.usageLog.aggregate({
      where: { tier: 'manual_grant', createdAt: { gte: monthStart } },
      _sum: { creditsUsed: true },
    }).then((r) => r._sum.creditsUsed ?? 0),
    prisma.usageLog.aggregate({
      where: { tier: { in: ['nano', 'basic', 'pro'] }, createdAt: { gte: monthStart } },
      _sum: { creditsUsed: true },
    }).then((r) => r._sum.creditsUsed ?? 0),
    prisma.topUp.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { credits: true },
    }).then((r) => r._sum.credits ?? 0),
    prisma.appSetting.findUnique({ where: { key: 'credit_rate_cents_per_credit' }, select: { value: true } }),
  ]);

  const rateCents = creditRate?.value ? parseInt(creditRate.value, 10) : 20;
  const ratePerCredit = (rateCents / 100).toFixed(2);

  return NextResponse.json({
    totalCreditsInCirculation: totalInCirculation,
    creditsGrantedThisMonth: manualThisMonth,
    creditsConsumedThisMonth: consumedThisMonth,
    creditsPurchasedThisMonth: purchasedThisMonth,
    creditRateCentsPerCredit: rateCents,
    creditRatePerCredit: ratePerCredit,
  });
}
