import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const confirmEmail = typeof body.email === 'string' ? body.email.trim() : '';

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  if (confirmEmail !== user.email) {
    return NextResponse.json({ error: 'Confirmation email does not match. Type the brand email to confirm deletion.' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'brand_deleted',
    entityType: 'brand',
    entityId: id,
    details: { email: user.email },
    ip: getIp(request),
  });

  return NextResponse.json({ success: true });
}
