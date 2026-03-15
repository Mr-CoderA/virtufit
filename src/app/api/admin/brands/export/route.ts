import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const monthStart = new Date();
  monthStart.setMonth(monthStart.getMonth());
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      credits: true,
      createdAt: true,
      suspended: true,
      _count: { select: { usageLogs: { where: { createdAt: { gte: monthStart }, tier: { in: ['nano', 'basic', 'pro'] } } } } },
      usageLogs: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
    },
  });

  const headers = ['#', 'Name', 'Email', 'Plan', 'Credits', 'Generations (30d)', 'Joined', 'Last active', 'Suspended'];
  const rows = users.map((u, i) => [
    i + 1,
    u.name ?? u.email,
    u.email,
    'FREE',
    u.credits,
    u._count.usageLogs,
    u.createdAt.toISOString().slice(0, 10),
    u.usageLogs[0]?.createdAt.toISOString().slice(0, 19) ?? '',
    u.suspended ? 'Yes' : 'No',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="virtufit-brands.csv"',
    },
  });
}
