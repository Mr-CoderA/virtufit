import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE, deleteSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete your account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: validation.session.userId },
      select: { id: true, password: true, email: true, name: true, tokenVersion: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.email,
        deletedReason: 'User requested account closure',
        suspended: true,
        tokenVersion: (user.tokenVersion ?? 0) + 1,
      },
    });

    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
