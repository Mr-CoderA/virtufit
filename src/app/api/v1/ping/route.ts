import { NextResponse } from 'next/server';
import { getSessionAndValidate } from '@/lib/auth';
import { getUserIdFromApiKey } from '@/lib/auth-api-key';
import { prisma } from '@/lib/db';

/**
 * GET /api/v1/ping
 * Auth: X-API-Key header, or session cookie (for dashboard test button when logged in).
 * Returns brand name, credit balance, and success. Does not consume credits.
 */
export async function GET(request: Request) {
  const apiKey = request.headers.get('X-API-Key');
  let user: { name: string | null; credits: number; suspended?: boolean } | null = await getUserIdFromApiKey(apiKey);

  if (!user) {
    const validation = await getSessionAndValidate();
    if (validation.valid) {
      const u = await prisma.user.findUnique({
        where: { id: validation.user.id },
        select: { name: true, credits: true, suspended: true },
      });
      if (u) user = { ...u, suspended: u.suspended };
    } else if (validation.deleted) {
      return NextResponse.json(
        { success: false, error: 'Account deleted', message: 'Your account has been closed. If you believe this is a mistake, contact support@virtufit.com', code: 'ACCOUNT_DELETED' },
        { status: 401 }
      );
    }
  }

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  if (user.suspended) {
    return NextResponse.json(
      { success: false, error: 'Account suspended', message: 'Your VirtuFit account has been suspended. Contact support at support@virtufit.com' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Connected.',
    brand: user.name || 'VirtuFit User',
    credits: user.credits,
  });
}
