import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmailSafe } from '@/lib/email';
import { accountDeletedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token.length !== 64) {
    return NextResponse.json(
      { error: 'Invalid link', message: 'This link is invalid. Log in to request a new deletion link.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { deletionToken: token },
    select: { id: true, email: true, name: true, deletionTokenExpiry: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid link', message: 'This link is invalid. Log in to request a new deletion link.' },
      { status: 400 }
    );
  }

  const now = new Date();
  if (user.deletionTokenExpiry && user.deletionTokenExpiry < now) {
    return NextResponse.json(
      { error: 'Link expired', message: 'This link has expired. Request deletion again from your settings.' },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isDeleted: true,
      deletedAt: now,
      deletedBy: user.email,
      deletedReason: 'Self-requested account deletion',
      suspended: true,
      tokenVersion: { increment: 1 },
      deletionToken: null,
      deletionTokenExpiry: null,
    },
  });

  const contact = await getContactSettings();
  const tpl = accountDeletedTemplate({ name: user.name, contact });
  sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  return NextResponse.json({
    message: "Your account has been deleted. We're sorry to see you go.",
    name: user.name,
  });
}
