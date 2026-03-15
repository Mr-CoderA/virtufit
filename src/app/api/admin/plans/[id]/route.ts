import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;

  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  const features = Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []);
  return NextResponse.json({ plan: { ...plan, features } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const features = Array.isArray(body.features) ? body.features.map((f: unknown) => String(f)) : undefined;
  const welcomeCredits = typeof body.welcomeCredits === 'number' ? body.welcomeCredits : body.welcomeCredits !== undefined ? parseInt(String(body.welcomeCredits), 10) : undefined;
  const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : undefined;
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (features !== undefined) update.features = features;
  if (welcomeCredits !== undefined) update.welcomeCredits = welcomeCredits;
  if (contactEmail !== undefined) update.contactEmail = contactEmail;
  if (description !== undefined) update.description = description;
  update.updatedBy = admin.adminId;

  await prisma.plan.update({ where: { id }, data: update as never });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'plan_updated',
    entityType: 'plan',
    entityId: id,
    details: { updatedFields: Object.keys(update) },
    ip: getIp(request),
  });

  return NextResponse.json({ success: true });
}
