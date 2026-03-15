import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;

  const body = await request.json().catch(() => ({}));
  const nano = Math.min(10, Math.max(1, parseInt(String(body.nano ?? 1), 10)));
  const basic = Math.min(10, Math.max(1, parseInt(String(body.basic ?? 1), 10)));
  const pro = Math.min(10, Math.max(1, parseInt(String(body.pro ?? 3), 10)));

  await prisma.$transaction([
    prisma.appSetting.upsert({ where: { key: 'tier_credits_nano' }, create: { key: 'tier_credits_nano', value: String(nano) }, update: { value: String(nano) } }),
    prisma.appSetting.upsert({ where: { key: 'tier_credits_basic' }, create: { key: 'tier_credits_basic', value: String(basic) }, update: { value: String(basic) } }),
    prisma.appSetting.upsert({ where: { key: 'tier_credits_pro' }, create: { key: 'tier_credits_pro', value: String(pro) }, update: { value: String(pro) } }),
  ]);

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'credit_costs_updated',
    entityType: 'setting',
    entityId: null,
    details: { nano, basic, pro },
    ip: getIp(request),
  });

  return NextResponse.json({ success: true, creditCosts: { nano, basic, pro } });
}
