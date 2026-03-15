import { NextResponse } from 'next/server';
import { verifyAdminToken, getAdminTokenFromRequest } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
  });
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    },
  });
}
