import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: validation.session.userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
