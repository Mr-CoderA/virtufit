import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topUps = await prisma.topUp.findMany({
    where: { userId: validation.session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      credits: true,
      amountCents: true,
      createdAt: true,
    },
    take: 50,
  });

  const list = topUps.map((t) => ({
    id: t.id,
    credits: t.credits,
    amountCents: t.amountCents,
    amountDollars: (t.amountCents / 100).toFixed(2),
    createdAt: t.createdAt.toISOString(),
  }));

  return NextResponse.json({ topUps: list });
}
