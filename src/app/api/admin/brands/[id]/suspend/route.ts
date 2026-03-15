import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, suspended: true } });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const nextSuspended = !user.suspended;
  await prisma.user.update({
    where: { id },
    data: { suspended: nextSuspended, suspendedAt: nextSuspended ? new Date() : null, suspendedReason: nextSuspended ? 'Suspended by admin' : null },
  });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: nextSuspended ? 'brand_suspended' : 'brand_unsuspended',
    entityType: 'brand',
    entityId: id,
    details: null,
    ip: getIp(request),
  });

  return NextResponse.json({ success: true, suspended: nextSuspended });
}
