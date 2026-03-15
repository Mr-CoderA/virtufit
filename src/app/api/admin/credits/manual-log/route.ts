import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where: { tier: { in: ['manual_grant', 'manual_deduction'] } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, userId: true, tier: true, creditsUsed: true, note: true, createdAt: true },
    }),
    prisma.usageLog.count({ where: { tier: { in: ['manual_grant', 'manual_deduction'] } } }),
  ]);

  const userIds = [...new Set(logs.map((l) => l.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const items = logs.map((l) => ({
    id: l.id,
    date: l.createdAt,
    brand: userMap[l.userId]?.name ?? userMap[l.userId]?.email ?? l.userId,
    brandId: l.userId,
    amount: l.tier === 'manual_deduction' ? -l.creditsUsed : l.creditsUsed,
    type: l.tier,
    reason: l.note,
  }));

  return NextResponse.json({ items, total, page, limit });
}
