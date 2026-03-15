import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { welcomeTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body.code === 'string' ? body.code.trim().replace(/\s/g, '') : '';

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'Invalid code', message: 'Please enter the 6-digit code from your email.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, verifyToken: true, verifyTokenExpiry: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid code', message: 'Invalid or expired code. Request a new one if needed.' },
      { status: 400 }
    );
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { error: 'Already verified', message: 'This email is already verified. You can sign in.' },
      { status: 400 }
    );
  }

  if (user.verifyToken !== code) {
    return NextResponse.json(
      { error: 'Invalid code', message: 'The code does not match. Check the code and try again.' },
      { status: 400 }
    );
  }

  const now = new Date();
  if (user.verifyTokenExpiry && user.verifyTokenExpiry < now) {
    return NextResponse.json(
      {
        error: 'Code expired',
        message: 'This code has expired. Request a new verification email.',
        code: 'TOKEN_EXPIRED',
      },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: now,
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  });

  const contact = await getContactSettings();
  const welcome = welcomeTemplate({ name: user.name, contact });
  await sendEmail({ to: user.email, subject: welcome.subject, html: welcome.html, text: welcome.text });

  const tokenJwt = await createSession({
    userId: user.id,
    email: user.email,
    tokenVersion: 0,
  });

  const brand = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, credits: true },
  });

  return NextResponse.json({
    message: 'Email verified successfully',
    token: tokenJwt,
    brand: brand ? { id: brand.id, name: brand.name, email: brand.email, plan: 'FREE', credits: brand.credits } : null,
  });
}
