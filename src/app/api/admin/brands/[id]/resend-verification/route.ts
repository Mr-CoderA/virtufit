import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { sendEmailSafe } from '@/lib/email';
import { verifyEmailTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

function generateVerificationCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  if (user.emailVerified) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
  }

  const verifyCode = generateVerificationCode();
  const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id },
    data: { verifyToken: verifyCode, verifyTokenExpiry },
  });

  const contact = await getContactSettings();
  const template = verifyEmailTemplate({ name: user.name, code: verifyCode, contact });
  sendEmailSafe({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return NextResponse.json({ message: 'Sent' });
}
