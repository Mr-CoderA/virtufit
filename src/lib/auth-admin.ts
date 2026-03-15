import { SignJWT, jwtVerify } from 'jose';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.JWT_ADMIN_SECRET || 'admin-fallback-secret-min-32-characters-long'
);

const EXPIRY = '8h';

export interface AdminPayload {
  adminId: string;
  email: string;
  role: 'admin';
}

export async function createAdminToken(payload: { adminId: string; email: string }): Promise<string> {
  return new SignJWT({ ...payload, role: 'admin' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .sign(ADMIN_SECRET);
}

export async function verifyAdminToken(token: string | null): Promise<AdminPayload | null> {
  if (!token?.trim()) return null;
  try {
    const { payload } = await jwtVerify(token.trim(), ADMIN_SECRET);
    if ((payload.role as string) !== 'admin') return null;
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      role: 'admin',
    };
  } catch {
    return null;
  }
}

export function getAdminTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}
