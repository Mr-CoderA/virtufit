import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { checkGlobalRateLimit, checkAuthRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/admin-audit';
import { loginSchema } from '@/lib/schemas/auth';
import { logger } from '@/lib/logger';
import { sendEmailSafe } from '@/lib/email';
import { loginFromNewDeviceTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

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
      { error: 'Too many login attempts. Try again in 15 minutes.', retryAfter: authLimit.retryAfter },
      { status: 429, headers: authLimit.retryAfter ? { 'Retry-After': String(authLimit.retryAfter) } : undefined }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isDeleted: true,
        tokenVersion: true,
        loginAttempts: true,
        lockedUntil: true,
        emailVerified: true,
        lastLoginIp: true,
      },
    });
    if (!user) {
      logger.security('Failed login attempt', { ip, emailMask: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (user.isDeleted) {
      const contact = await getContactSettings();
      return NextResponse.json(
        { error: 'Account not found', message: `This account no longer exists. Contact ${contact.email} if you believe this is a mistake.` },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          message: 'Please check your inbox and verify your email before logging in.',
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email,
        },
        { status: 403 }
      );
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const mins = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        {
          error: 'Account temporarily locked',
          message: `Too many failed attempts. Try again in ${mins} minutes.`,
          lockedUntil: user.lockedUntil.toISOString(),
        },
        { status: 423 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const newAttempts = (user.loginAttempts ?? 0) + 1;
      const updates: { loginAttempts: number; lockedUntil?: Date } = { loginAttempts: newAttempts };
      if (newAttempts >= LOCKOUT_ATTEMPTS) {
        const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
        updates.lockedUntil = lockedUntil;
        logger.security('Account lockout triggered', { ip, emailMask: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });
      logger.security('Failed login attempt', { ip, emailMask: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isNewDevice = user.lastLoginIp != null && user.lastLoginIp !== ip;
    if (isNewDevice) {
      const userAgent = request.headers.get('user-agent') ?? 'Unknown';
      const contact = await getContactSettings();
      const tpl = loginFromNewDeviceTemplate({
        name: user.name,
        ip,
        userAgent,
        time: new Date().toISOString(),
        contact,
      });
      sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginIp: ip,
        lastLoginAt: now,
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    logger.error('Login error', { err: String(e) });
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
