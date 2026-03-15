import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { getContactSettings, updateSetting, clearSettingsCache } from '@/lib/app-settings';
import { logAdminAction } from '@/lib/admin-audit';
import { getIp } from '@/lib/admin-audit';

const contactKeys = ['support_email', 'support_phone', 'whatsapp_number', 'founder_name'] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [...contactKeys] } },
    select: { key: true, value: true, updatedAt: true, updatedBy: true },
  });
  const map: Record<string, { value: string; updatedAt: string | null; updatedBy: string | null }> = {};
  for (const k of contactKeys) {
    const row = rows.find((r) => r.key === k);
    map[k] = {
      value: row?.value ?? (k === 'support_email' ? 'asadalinawaz700@gmail.com' : k === 'support_phone' ? '+923213889791' : k === 'whatsapp_number' ? '923213889791' : 'Asad Ali'),
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  }
  return NextResponse.json(map);
}

const putSchema = z.object({
  support_email: z.string().email(),
  support_phone: z.string().min(10).max(20),
  whatsapp_number: z.string().regex(/^\d+$/).min(10).max(15),
  founder_name: z.string().min(2).max(100),
});

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const ip = getIp(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? 'Validation failed' }, { status: 400 });
  }
  const previous = await getContactSettings();
  const prevValues = {
    support_email: previous.email,
    support_phone: previous.phone,
    whatsapp_number: previous.whatsapp,
    founder_name: previous.founderName,
  };
  await updateSetting('support_email', parsed.data.support_email, admin.email);
  await updateSetting('support_phone', parsed.data.support_phone, admin.email);
  await updateSetting('whatsapp_number', parsed.data.whatsapp_number, admin.email);
  await updateSetting('founder_name', parsed.data.founder_name, admin.email);
  clearSettingsCache();
  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'contact_settings_updated',
    entityType: 'setting',
    entityId: null,
    details: {
      updatedFields: contactKeys,
      previousValues: prevValues,
      newValues: parsed.data,
      updatedBy: admin.email,
    },
    ip,
  });
  return NextResponse.json({ success: true, message: 'Updated' });
}
