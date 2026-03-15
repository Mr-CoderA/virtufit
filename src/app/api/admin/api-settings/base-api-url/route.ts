import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;

  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === 'string' ? body.url.trim().replace(/\/+$/, '') : '';
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }
  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL (must be http or https)' }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key: 'base_api_url' },
    create: { key: 'base_api_url', value: url },
    update: { value: url },
  });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'setting_updated',
    entityType: 'setting',
    entityId: 'base_api_url',
    details: { key: 'base_api_url', value: url },
    ip: getIp(request),
  });

  return NextResponse.json({ baseApiUrl: url });
}
