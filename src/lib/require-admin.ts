import { NextResponse } from 'next/server';
import { verifyAdminToken, getAdminTokenFromRequest } from '@/lib/auth-admin';
import { checkAdminRateLimit } from '@/lib/rate-limit';

export type AdminAuth = { adminId: string; email: string; role: 'admin' };

/**
 * Use in admin API routes. Returns NextResponse (401/429) if not authenticated or rate limited; otherwise returns null and sets reqAdmin in the object.
 */
export async function requireAdmin(request: Request): Promise<{ response: NextResponse } | { admin: AdminAuth }> {
  const token = getAdminTokenFromRequest(request);
  const admin = await verifyAdminToken(token);
  if (!admin) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!checkAdminRateLimit(admin.adminId)) {
    return { response: NextResponse.json({ error: 'Too many requests' }, { status: 429 }) };
  }
  return { admin };
}
