import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';
import { sendEmailSafe } from '@/lib/email';
import { accountSuspendedTemplate, accountUnsuspendedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, suspended: true, email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const nextSuspended = !user.suspended;
  const reason = nextSuspended ? 'Suspended by admin' : null;
  await prisma.user.update({
    where: { id },
    data: { suspended: nextSuspended, suspendedAt: nextSuspended ? new Date() : null, suspendedReason: reason },
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

  const contact = await getContactSettings();
  if (nextSuspended) {
    const tpl = accountSuspendedTemplate({ name: user.name, reason: reason ?? undefined, contact });
    sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  } else {
    const tpl = accountUnsuspendedTemplate({ name: user.name, contact });
    sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  return NextResponse.json({ success: true, suspended: nextSuspended });
}
