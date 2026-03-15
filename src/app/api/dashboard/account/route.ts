import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmailSafe } from '@/lib/email';
import { deletionRequestTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

function getFrontendUrl(): string {
  const url = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? '').trim().replace(/\/+$/, '');
  return url || 'https://virtufit-seven.vercel.app';
}

/**
 * DELETE /api/dashboard/account
 * Request account deletion: sends confirmation email. Does not delete immediately.
 */
export async function DELETE() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: validation.session.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const deletionToken = crypto.randomBytes(32).toString('hex');
  const deletionTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.user.update({
    where: { id: user.id },
    data: { deletionToken, deletionTokenExpiry },
  });

  const confirmationUrl = `${getFrontendUrl()}/confirm-deletion?token=${deletionToken}`;
  const contact = await getContactSettings();
  const template = deletionRequestTemplate({ name: user.name, confirmationUrl, contact });
  sendEmailSafe({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return NextResponse.json({
    message: 'Confirmation email sent. Check your inbox to complete account deletion.',
    expiresIn: '1 hour',
  });
}
