import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { checkGlobalRateLimit, checkAuthRateLimit } from '@/lib/rate-limit';
import { getIp, logSystemAudit } from '@/lib/admin-audit';
import { sendEmail } from '@/lib/email';
import { accountReactivatedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

const REACTIVATION_LOCKOUT_ATTEMPTS = 5;
const REACTIVATION_LOCKOUT_MINUTES = 30;
const REACTIVATION_WINDOW_DAYS = 90;

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
      { error: 'Too many attempts. Try again later.', retryAfter: authLimit.retryAfter },
      { status: 429, headers: authLimit.retryAfter ? { 'Retry-After': String(authLimit.retryAfter) } : undefined }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, isDeleted: true },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        credits: true,
        deletedAt: true,
        deletedBy: true,
        deletedReason: true,
        tokenVersion: true,
        reactivationAttempts: true,
        reactivationLockedUntil: true,
        apiKeys: { take: 1, select: { keyPrefix: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No deleted account found for this email' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (user.reactivationLockedUntil && user.reactivationLockedUntil > now) {
      const mins = Math.ceil((user.reactivationLockedUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        {
          error: 'Too many attempts',
          message: `Try again in ${mins} minutes or contact support.`,
          code: 'REACTIVATION_LOCKED',
        },
        { status: 423 }
      );
    }

    const deletedAt = user.deletedAt ? new Date(user.deletedAt) : null;
    const daysSinceDeletion = deletedAt
      ? Math.floor((Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    if (daysSinceDeletion > REACTIVATION_WINDOW_DAYS) {
      return NextResponse.json(
        {
          error: 'Reactivation window expired',
          code: 'WINDOW_EXPIRED',
          message: 'The 90-day reactivation window has passed. Please create a new account.',
        },
        { status: 410 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const newAttempts = (user.reactivationAttempts ?? 0) + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          reactivationAttempts: newAttempts,
          ...(newAttempts >= REACTIVATION_LOCKOUT_ATTEMPTS && {
            reactivationLockedUntil: new Date(now.getTime() + REACTIVATION_LOCKOUT_MINUTES * 60 * 1000),
          }),
        },
      });
      return NextResponse.json(
        {
          error: 'Incorrect password',
          message: 'Enter the password from your old account to reactivate it.',
        },
        { status: 401 }
      );
    }

    const previousDeletionReason = user.deletedReason ?? null;
    const newTokenVersion = (user.tokenVersion ?? 0) + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
        suspended: false,
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
        deletionToken: null,
        deletionTokenExpiry: null,
        tokenVersion: newTokenVersion,
        reactivatedAt: now,
        reactivationCount: { increment: 1 },
        reactivationPreviousDeletionReason: previousDeletionReason,
        reactivationAttempts: 0,
        reactivationLockedUntil: null,
        updatedAt: now,
      },
    });

    await prisma.usageLog.create({
      data: {
        userId: user.id,
        tier: 'system',
        creditsUsed: 0,
        jobId: `account_reactivated_${Date.now()}`,
        outputUrl: null,
        note: 'Account reactivated',
      },
    });

    const apiKeyPrefix = user.apiKeys[0]?.keyPrefix ?? 'vf_live_****';
    const contact = await getContactSettings();
    const tpl = accountReactivatedTemplate({
      name: user.name,
      credits: user.credits,
      apiKeyPrefix: apiKeyPrefix.length > 12 ? `${apiKeyPrefix.slice(0, 12)}...` : apiKeyPrefix,
      contact,
    });
    await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

    await logSystemAudit({
      action: 'account_reactivated',
      entityType: 'brand',
      entityId: user.id,
      details: {
        brandEmail: user.email,
        deletedAt: user.deletedAt,
        daysSinceDeletion,
        reactivatedBy: 'self',
        previousDeletionReason,
      },
      ip,
    });

    const tokenJwt = await createSession({
      userId: user.id,
      email: user.email,
      tokenVersion: newTokenVersion,
    });

    return NextResponse.json({
      message: 'Account reactivated successfully. Welcome back!',
      token: tokenJwt,
      brand: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: 'FREE',
        credits: user.credits,
      },
      creditsRestored: user.credits,
      note: 'Your previous credits, API key, and usage history have been restored.',
    });
  } catch (e) {
    console.error('Reactivate error', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
