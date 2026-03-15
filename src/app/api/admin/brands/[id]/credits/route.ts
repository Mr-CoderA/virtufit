import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';
import { sendEmailSafe } from '@/lib/email';
import { creditsAddedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  let body: { amount?: number; type?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const amount = typeof body.amount === 'number' ? body.amount : parseInt(String(body.amount), 10);
  const type = body.type === 'grant' || body.type === 'deduct' ? body.type : null;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!type || Number.isNaN(amount) || amount < 1) {
    return NextResponse.json({ error: 'amount and type (grant|deduct) required' }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: 'reason is required for audit trail' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, credits: true, email: true, name: true } });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  if (type === 'deduct' && user.credits < amount) {
    return NextResponse.json({ error: 'Insufficient credits to deduct' }, { status: 400 });
  }

  const newCredits = type === 'grant' ? user.credits + amount : user.credits - amount;

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { credits: newCredits } }),
    prisma.usageLog.create({
      data: {
        userId: id,
        tier: type === 'grant' ? 'manual_grant' : 'manual_deduction',
        creditsUsed: amount,
        jobId: null,
        outputUrl: null,
        note: reason,
      },
    }),
  ]);

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: type === 'grant' ? 'credits_grant' : 'credits_deduct',
    entityType: 'credit',
    entityId: id,
    details: { amount, reason, newBalance: newCredits },
    ip: getIp(request),
  });

  if (type === 'grant') {
    const contact = await getContactSettings();
    const tpl = creditsAddedTemplate({ name: user.name, credits: amount, newBalance: newCredits, reason, contact });
    sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  return NextResponse.json({ success: true, credits: newCredits });
}
