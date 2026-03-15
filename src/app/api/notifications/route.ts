import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let list = await prisma.notification.findMany({
    where: { userId: validation.session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (list.length === 0) {
    await prisma.notification.create({
      data: {
        userId: validation.session.userId,
        title: 'Welcome',
        body: 'Your account is ready. You start with 10 credits — top up anytime from the dashboard.',
        read: false,
      },
    });
    list = await prisma.notification.findMany({
      where: { userId: validation.session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  return NextResponse.json({
    notifications: list.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: list.filter((n) => !n.read).length,
  });
}
