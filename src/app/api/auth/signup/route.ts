import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

function generateVerificationCode(): string {
  return String(crypto.randomInt(100000, 999999));
}
import { prisma } from '@/lib/db';
import { checkGlobalRateLimit, checkAuthRateLimit } from '@/lib/rate-limit';
import { getIp, logSystemAudit } from '@/lib/admin-audit';
import { registerSchema } from '@/lib/schemas/auth';
import { sanitizeString } from '@/lib/sanitize';
import { validatePasswordStrength } from '@/lib/password-strength';
import { logger } from '@/lib/logger';
import { sendEmailSafe } from '@/lib/email';
import { verifyEmailTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function POST(request: Request) {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
      { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
    );
  }
  const authLimit = checkAuthRateLimit(ip);
  if (!authLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.', retryAfter: authLimit.retryAfter },
      { status: 429, headers: authLimit.retryAfter ? { 'Retry-After': String(authLimit.retryAfter) } : undefined }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { email, password, name } = parsed.data;
    const safeName = name ? sanitizeString(name, 100) : null;

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      if (!existing.isDeleted) {
        return NextResponse.json(
          { error: 'Email already registered', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
      const deletedAt = existing.deletedAt ? new Date(existing.deletedAt) : null;
      const daysSinceDeletion = deletedAt
        ? Math.floor((Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      if (daysSinceDeletion <= 90) {
        const reactivatableUntil = deletedAt
          ? new Date(deletedAt.getTime() + 90 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        return NextResponse.json(
          {
            error: 'Account exists',
            code: 'ACCOUNT_RECOVERABLE',
            message: 'An account with this email was recently deleted. Would you like to reactivate it?',
            deletedAt: existing.deletedAt,
            reactivatableUntil: reactivatableUntil.toISOString(),
            daysRemaining: 90 - daysSinceDeletion,
            deletedBy: existing.deletedBy ?? undefined,
          },
          { status: 409 }
        );
      }
      await prisma.user.update({
        where: { id: existing.id },
        data: { email: `${email}_deleted_${Date.now()}` },
      });
    }

    const verifyCode = generateVerificationCode();
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const isReRegisterAfter90Days = !!existing;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: safeName || null,
        credits: isReRegisterAfter90Days ? 10 : 5,
        emailVerified: false,
        verifyToken: verifyCode,
        verifyTokenExpiry,
        notes: isReRegisterAfter90Days
          ? 'Re-registered after 90-day deletion window of previous account'
          : null,
        notifications: {
          create: {
            title: 'Verify your email',
            body: 'Check your inbox for a verification code to activate your account.',
          },
        },
      },
    });

    const contact = await getContactSettings();
    const template = verifyEmailTemplate({ name: safeName ?? null, code: verifyCode, contact });
    sendEmailSafe({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (isReRegisterAfter90Days && existing) {
      const daysSincePreviousDeletion = existing.deletedAt
        ? Math.floor((Date.now() - new Date(existing.deletedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      await logSystemAudit({
        action: 'fresh_account_after_expired_window',
        entityType: 'brand',
        entityId: user.id,
        details: {
          email: user.email,
          previousAccountId: existing.id,
          daysSincePreviousDeletion,
        },
        ip,
      });
    }

    return NextResponse.json(
      {
        message: 'Account created. Please verify your email to activate your account.',
        emailSent: true,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (e) {
    logger.error('Signup error', { err: String(e) });
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
