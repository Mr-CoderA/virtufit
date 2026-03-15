import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getIp } from '@/lib/admin-audit';
import { checkGlobalRateLimit, checkContactFormRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { getContactSettings } from '@/lib/app-settings';
import { contactNotificationTemplate, contactConfirmationTemplate } from '@/lib/email-templates';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
]);

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').max(254),
  brand: z.string().max(100).optional(),
  platform: z.string().max(50).optional(),
  subject: z.string().min(3, 'Please select a topic').max(100),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
  website: z.string().max(500).optional(), // honeypot
});

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const matches = text.match(urlPattern);
  return matches ? matches.length : 0;
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
      { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
    );
  }
  const contactLimit = checkContactFormRateLimit(ip);
  if (!contactLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Try again later.', retryAfter: contactLimit.retryAfter },
      { status: 429, headers: contactLimit.retryAfter ? { 'Retry-After': String(contactLimit.retryAfter) } : undefined }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    // Honeypot: if "website" field is filled, pretend success but do nothing
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ success: true, message: 'Sent' });
    }
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }
    const { name, email, brand, platform, subject, message } = parsed.data;

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Please use a permanent email address.' },
        { status: 400 }
      );
    }
    if (countUrls(message) > 3) {
      return NextResponse.json(
        { error: 'Message contains too many links.' },
        { status: 400 }
      );
    }

    const contact = await getContactSettings();
    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        brand: brand || null,
        platform: platform || null,
        subject,
        message,
        ip,
      },
    });

    const notif = contactNotificationTemplate({
      name,
      email,
      brand: brand || null,
      platform: platform || null,
      subject,
      message,
      contact,
    });
    await sendEmail({
      to: contact.email,
      subject: notif.subject,
      html: notif.html,
      text: notif.text,
    });

    const confirm = contactConfirmationTemplate({ name, email, contact });
    await sendEmail({
      to: email,
      subject: confirm.subject,
      html: confirm.html,
      text: confirm.text,
    });

    return NextResponse.json({ success: true, message: 'Sent', id: submission.id });
  } catch (e) {
    console.error('Contact form error', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
