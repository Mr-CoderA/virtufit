import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const users = await prisma.user.findMany({
    where: { credits: { lt: 5 } },
    orderBy: { credits: 'asc' },
    select: { id: true, name: true, email: true, credits: true },
  });

  const withLastTopUp = await Promise.all(
    users.map(async (u) => {
      const last = await prisma.topUp.findFirst({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
      return { ...u, lastTopUp: last?.createdAt ?? null };
    })
  );

  return NextResponse.json({ items: withLastTopUp });
}
