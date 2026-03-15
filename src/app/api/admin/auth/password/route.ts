import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

const MIN_LENGTH = 12;

function validPassword(p: string): boolean {
  if (p.length < MIN_LENGTH) return false;
  if (!/\d/.test(p)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) return false;
  return true;
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;

  const body = await request.json().catch(() => ({}));
  const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPass = typeof body.newPassword === 'string' ? body.newPassword : '';
  const confirm = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

  if (!current || !newPass || !confirm) {
    return NextResponse.json({ error: 'Current password, new password, and confirm are required' }, { status: 400 });
  }
  if (newPass !== confirm) {
    return NextResponse.json({ error: 'New password and confirm do not match' }, { status: 400 });
  }
  if (!validPassword(newPass)) {
    return NextResponse.json({
      error: `New password must be at least ${MIN_LENGTH} characters and include a number and a symbol`,
    }, { status: 400 });
  }

  const adminRow = await prisma.admin.findUnique({ where: { id: admin.adminId }, select: { passwordHash: true } });
  if (!adminRow) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const valid = await bcrypt.compare(current, adminRow.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPass, 10);
  await prisma.admin.update({
    where: { id: admin.adminId },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true, message: 'Password changed. Please sign in again.' });
}
