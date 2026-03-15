import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { checkGlobalRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/admin-audit';
import { checkResendVerificationRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { verifyEmailTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

function generateVerificationCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
      { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const rate = checkResendVerificationRateLimit(email);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.', retryAfter: rate.retryAfter },
      { status: 429, headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : undefined }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ message: 'Verification email sent if account exists' });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
  }

  const verifyCode = generateVerificationCode();
  const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { verifyToken: verifyCode, verifyTokenExpiry },
  });

  const contact = await getContactSettings();
  const template = verifyEmailTemplate({ name: user.name, code: verifyCode, contact });
  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return NextResponse.json({ message: 'Verification email sent if account exists' });
}
