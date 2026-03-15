import { NextResponse } from 'next/server';
import { getUserIdFromApiKey } from '@/lib/auth-api-key';
import { prisma } from '@/lib/db';

/**
 * POST /api/v1/widget-beacon
 * Called by the widget when opened (from a store domain). Records the origin for onboarding.
 * Body: { origin: string }
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get('X-API-Key');
  const user = await getUserIdFromApiKey(apiKey);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  let body: { origin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
  if (!origin || !/^https?:\/\//.test(origin)) {
    return NextResponse.json({ error: 'Valid origin required' }, { status: 400 });
  }

  try {
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { integratedDomains: true },
    });
    const domains = (u?.integratedDomains ?? []) as string[];
    const host = new URL(origin).host;
    if (!domains.includes(host)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { integratedDomains: [...domains, host] },
      });
    }
  } catch (e) {
    console.error('Widget beacon error:', e);
    return NextResponse.json({ error: 'Failed to record' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
