import { NextResponse } from 'next/server';
import { verifyAdminToken, getAdminTokenFromRequest } from '@/lib/auth-admin';
import { checkAdminRateLimit, checkGlobalRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/admin-audit';

export type AdminAuth = { adminId: string; email: string; role: 'admin' };

/**
 * Use in admin API routes. Returns NextResponse (401/429) if not authenticated or rate limited; otherwise returns admin.
 */
export async function requireAdmin(request: Request): Promise<{ response: NextResponse } | { admin: AdminAuth }> {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return {
      response: NextResponse.json(
        { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
        { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
      ),
    };
  }
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
