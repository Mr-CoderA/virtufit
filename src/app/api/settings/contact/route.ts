import { NextResponse } from 'next/server';
import { getContactSettings } from '@/lib/app-settings';
import { getIp } from '@/lib/admin-audit';
import { checkContactSettingsRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const ip = getIp(request);
  const limit = checkContactSettingsRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: limit.retryAfter },
      { status: 429, headers: limit.retryAfter ? { 'Retry-After': String(limit.retryAfter) } : undefined }
    );
  }
  const contact = await getContactSettings();
  return NextResponse.json({
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    founderName: contact.founderName,
  });
}
