import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;

  const body = await request.json().catch(() => ({}));
  const rate = typeof body.rate === 'number' ? body.rate : parseFloat(String(body.rate ?? '0'));
  if (Number.isNaN(rate) || rate < 0.01 || rate > 10) {
    return NextResponse.json({ error: 'Rate must be between 0.01 and 10.00' }, { status: 400 });
  }
  const cents = Math.round(rate * 100);

  await prisma.appSetting.upsert({
    where: { key: 'credit_rate_cents_per_credit' },
    create: { key: 'credit_rate_cents_per_credit', value: String(cents) },
    update: { value: String(cents) },
  });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'credit_rate_changed',
    entityType: 'setting',
    entityId: null,
    details: { rateCents: cents },
    ip: getIp(request),
  });

  return NextResponse.json({ success: true, rateCents: cents, ratePerCredit: (cents / 100).toFixed(2) });
}
