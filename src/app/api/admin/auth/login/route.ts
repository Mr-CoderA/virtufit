import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createAdminToken } from '@/lib/auth-admin';
import { checkAdminLoginRateLimit } from '@/lib/rate-limit';
import { logAdminAction, getIp } from '@/lib/admin-audit';

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkAdminLoginRateLimit(ip)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!admin) {
      console.warn(`[Admin login failed] IP: ${ip} at ${new Date().toISOString()} — email not found`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(String(password), admin.passwordHash);
    if (!valid) {
      console.warn(`[Admin login failed] IP: ${ip} at ${new Date().toISOString()} — invalid password for ${admin.email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
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

    return NextResponse.json({ token });
  } catch (e) {
    console.error('Admin login error:', e);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
