import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';
import { sendEmailSafe } from '@/lib/email';
import { accountDeletedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      credits: true,
      createdAt: true,
      suspended: true,
      suspendedAt: true,
      suspendedReason: true,
      isDeleted: true,
      deletedAt: true,
      deletedBy: true,
      deletedReason: true,
      emailVerified: true,
      emailVerifiedAt: true,
      reactivatedAt: true,
      reactivationPreviousDeletionReason: true,
      apiKeys: { take: 1, select: { keyPrefix: true } },
      usageLogs: { orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, tier: true, creditsUsed: true, jobId: true, outputUrl: true, note: true, createdAt: true } },
      topUps: { orderBy: { createdAt: 'desc' }, select: { id: true, credits: true, amountCents: true, orderId: true, createdAt: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const apiKeyPrefix = user.apiKeys[0]?.keyPrefix ?? null;

  const wasReactivated = user.reactivatedAt != null;
  return NextResponse.json({
    brand: {
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      createdAt: user.createdAt,
      suspended: user.suspended,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      isDeleted: user.isDeleted,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
      deletedReason: user.deletedReason,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      apiKeyPrefix: apiKeyPrefix ? `${apiKeyPrefix.slice(0, 8)}...` : null,
      wasReactivated,
      reactivatedAt: user.reactivatedAt?.toISOString() ?? null,
      previousDeletionReason: user.reactivationPreviousDeletionReason ?? null,
    },
    creditHistory: user.usageLogs.map((l) => ({ ...l, type: l.tier, amount: l.tier === 'manual_deduction' ? -l.creditsUsed : l.creditsUsed })),
    generations: user.usageLogs.filter((l) => l.tier && ['nano', 'basic', 'pro'].includes(l.tier)),
    revenue: user.topUps,
    totalSpentLifetime: user.topUps.reduce((s, t) => s + t.amountCents, 0) / 100,
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 10) {
    return NextResponse.json({ error: 'Reason is required (min 10 characters)' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { id }, select: { id: true, email: true, name: true, isDeleted: true, tokenVersion: true } });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  if (user.isDeleted) {
    return NextResponse.json({ error: 'Brand is already deleted' }, { status: 400 });
  }

  const deletedAt = new Date();
  await prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt,
      deletedBy: admin.email,
      deletedReason: reason,
      suspended: true,
      tokenVersion: (user.tokenVersion ?? 0) + 1,
    },
  });

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'brand_deleted',
    entityType: 'brand',
    entityId: id,
    details: { brandEmail: user.email, brandName: user.name, reason, deletedBy: admin.email },
    ip: getIp(request),
  });

  const contact = await getContactSettings();
  const tpl = accountDeletedTemplate({ name: user.name, contact });
  sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  return NextResponse.json({
    message: 'Brand soft deleted successfully',
    deletedAt: deletedAt.toISOString(),
    restorable: true,
  });
}
