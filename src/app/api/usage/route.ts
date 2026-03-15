import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function GET() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.usageLog.findMany({
    where: { userId: validation.session.userId, createdAt: { gte: since } },
    select: { createdAt: true, creditsUsed: true },
    orderBy: { createdAt: 'asc' },
  });

  const byDay: Record<string, { calls: number; credits: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { calls: 0, credits: 0 };
  }

  for (const log of logs) {
    const key = new Date(log.createdAt).toISOString().slice(0, 10);
    if (byDay[key]) {
      byDay[key].calls += 1;
      byDay[key].credits += log.creditsUsed;
    }
  }

  const sortedKeys = Object.keys(byDay).sort();
  const data = sortedKeys.map((key) => ({
    date: DAY_NAMES[new Date(key).getDay()],
    calls: byDay[key].calls,
    credits: byDay[key].credits,
  }));

  return NextResponse.json({ data });
}
