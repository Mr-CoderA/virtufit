import { SignJWT, jwtVerify } from 'jose';

function adminSecret() {
  const value = process.env.JWT_ADMIN_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_ADMIN_SECRET must contain at least 32 characters');
  return new TextEncoder().encode(value);
}

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
    .sign(adminSecret());
}

export async function verifyAdminToken(token: string | null): Promise<AdminPayload | null> {
  if (!token?.trim()) return null;
  try {
    const { payload } = await jwtVerify(token.trim(), adminSecret(), { algorithms: ['HS256'] });
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
