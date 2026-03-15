import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkGlobalRateLimit, checkReactivatableRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/admin-audit';

const REACTIVATION_WINDOW_DAYS = 90;

/** GET /api/auth/check-reactivatable?email=xxx — only for deleted accounts; never reveals if non-deleted account exists. */
export async function GET(request: Request) {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
      { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
    );
  }
  const checkLimit = checkReactivatableRateLimit(ip);
  if (!checkLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: checkLimit.retryAfter },
      { status: 429, headers: checkLimit.retryAfter ? { 'Retry-After': String(checkLimit.retryAfter) } : undefined }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email, isDeleted: true },
    select: { deletedAt: true },
  });

  if (!user || !user.deletedAt) {
    return NextResponse.json({ recoverable: false, daysRemaining: 0, reactivatableUntil: null });
  }

  const deletedAt = new Date(user.deletedAt);
  const daysSinceDeletion = Math.floor(
    (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const reactivatableUntil = new Date(deletedAt.getTime() + REACTIVATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(0, REACTIVATION_WINDOW_DAYS - daysSinceDeletion);

  return NextResponse.json({
    recoverable: daysRemaining > 0,
    daysRemaining,
    reactivatableUntil: reactivatableUntil.toISOString(),
  });
}
