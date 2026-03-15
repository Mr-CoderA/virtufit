import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createAdminToken } from '@/lib/auth-admin';
import { checkAdminLoginRateLimit, checkGlobalRateLimit } from '@/lib/rate-limit';
import { logAdminAction, getIp } from '@/lib/admin-audit';
import { logger } from '@/lib/logger';

const ADMIN_LOCKOUT_ATTEMPTS = 5;
const ADMIN_LOCKOUT_MINUTES = 60;

export async function POST(request: Request) {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
      { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
    );
  }
  if (!checkAdminLoginRateLimit(ip)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, loginAttempts: true, lockedUntil: true },
    });
    if (!admin) {
      logger.security('Admin login failed', { ip, emailMask: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const now = new Date();
    if (admin.lockedUntil && admin.lockedUntil > now) {
      const mins = Math.ceil((admin.lockedUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        {
          error: 'Account temporarily locked',
          message: `Too many failed attempts. Try again in ${mins} minutes.`,
        },
        { status: 423 }
      );
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      const newAttempts = (admin.loginAttempts ?? 0) + 1;
      const updates: { loginAttempts: number; lockedUntil?: Date } = { loginAttempts: newAttempts };
      if (newAttempts >= ADMIN_LOCKOUT_ATTEMPTS) {
        updates.lockedUntil = new Date(now.getTime() + ADMIN_LOCKOUT_MINUTES * 60 * 1000);
        logger.security('Admin account lockout', { ip, adminEmail: admin.email });
      }
      await prisma.admin.update({ where: { id: admin.id }, data: updates });
      logger.security('Admin login failed', { ip, adminEmail: admin.email });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: now, loginAttempts: 0, lockedUntil: null },
    });

    const token = await createAdminToken({ adminId: admin.id, email: admin.email });
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'login_success',
      entityType: 'auth',
      entityId: null,
      details: null,
      ip,
    });
    logger.security('Admin login success', { ip, adminEmail: admin.email });

    return NextResponse.json({ token });
  } catch (e) {
    logger.error('Admin login error', { err: String(e) });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
