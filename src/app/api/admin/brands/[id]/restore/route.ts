import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';
import { sendEmailSafe } from '@/lib/email';
import { accountRestoredTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const user = await prisma.user.findFirst({ where: { id }, select: { id: true, email: true, name: true, isDeleted: true, tokenVersion: true } });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  if (!user.isDeleted) {
    return NextResponse.json({ error: 'Brand is not deleted' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
      suspended: false,
      tokenVersion: (user.tokenVersion ?? 0) + 1,
    },
  });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'brand_restored',
    entityType: 'brand',
    entityId: id,
    details: { brandEmail: user.email, brandName: user.name, restoredBy: admin.email },
    ip: getIp(request),
  });

  const contact = await getContactSettings();
  const tpl = accountRestoredTemplate({ name: user.name, contact });
  sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  return NextResponse.json({ message: 'Brand restored. They can now log in again.' });
}
