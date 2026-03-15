// In-memory rate limiters (reset on server restart)

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 min
const ADMIN_LOGIN_MAX = 10;

export function checkAdminLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, { count: 1, resetAt: now + ADMIN_LOGIN_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + ADMIN_LOGIN_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= ADMIN_LOGIN_MAX;
}

const adminReqCount = new Map<string, { count: number; resetAt: number }>();
const ADMIN_REQ_WINDOW_MS = 60 * 1000; // 1 min
const ADMIN_REQ_MAX = 100;

export function checkAdminRateLimit(adminId: string): boolean {
  const now = Date.now();
  const entry = adminReqCount.get(adminId);
  if (!entry) {
    adminReqCount.set(adminId, { count: 1, resetAt: now + ADMIN_REQ_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    adminReqCount.set(adminId, { count: 1, resetAt: now + ADMIN_REQ_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= ADMIN_REQ_MAX;
}
