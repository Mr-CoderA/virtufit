import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'session';
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-min-32-characters-long'
);

export interface SessionPayload {
  userId: string;
  email: string;
  expiresAt: number;
  tokenVersion?: number;
}

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'> & { tokenVersion?: number }) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const token = await new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.expiresAt && (payload.expiresAt as number) < Date.now()) {
      return null;
    }
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      expiresAt: payload.expiresAt as number,
      tokenVersion: payload.tokenVersion as number | undefined,
    };
  } catch {
    return null;
  }
}

export type SessionValidation = { valid: true; session: SessionPayload; user: { id: string; email: string } } | { valid: false; deleted?: boolean };

/** Use in brand-facing API routes when getSessionAndValidate() returns deleted: true */
export const ACCOUNT_DELETED_RESPONSE = {
  error: 'Account deleted',
  message: 'Your account has been closed. If you believe this is a mistake, contact support@virtufit.com',
  code: 'ACCOUNT_DELETED' as const,
};

/**
 * Returns current session and validates user exists, is not deleted, and tokenVersion matches.
 * Use on brand-facing routes. If deleted is true, return 401 with code ACCOUNT_DELETED (do not reveal "deleted" to brand).
 */
export async function getSessionAndValidate(): Promise<SessionValidation> {
  const session = await getSession();
  if (!session) return { valid: false };
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, isDeleted: true, tokenVersion: true },
  });
  if (!user) return { valid: false };
  if (user.isDeleted) return { valid: false, deleted: true };
  const sessionVersion = session.tokenVersion ?? 0;
  if (user.tokenVersion !== sessionVersion) return { valid: false };
  return { valid: true, session, user };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
