import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { changePasswordSchema } from '@/lib/schemas/auth';
import { validatePasswordStrength } from '@/lib/password-strength';
import { logger } from '@/lib/logger';
import { sendEmailSafe } from '@/lib/email';
import { passwordChangedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function POST(request: Request) {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Current password and new password are required' },
        { status: 400 }
      );
    }
    const { currentPassword, newPassword } = parsed.data;

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: validation.session.userId },
      select: { id: true, password: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: validation.session.userId },
      data: { password: hashedPassword },
    });

    const contact = await getContactSettings();
    const tpl = passwordChangedTemplate({ name: user.name, contact });
    sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error('Change password error', { err: String(e) });
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
