// In-memory rate limiters (reset on server restart)

export function checkRateLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  windowMs: number,
  max: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

// Global (all API routes by IP)
const globalMap = new Map<string, { count: number; resetAt: number }>();
const GLOBAL_WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_MAX = 300;

export function checkGlobalRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(globalMap, ip, GLOBAL_WINDOW_MS, GLOBAL_MAX);
}

// Auth (login/register by IP)
const authMap = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX = 10;

export function checkAuthRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(authMap, ip, AUTH_WINDOW_MS, AUTH_MAX);
}

// Resend verification email: 3 per hour per email
const resendVerificationMap = new Map<string, { count: number; resetAt: number }>();
const RESEND_VERIFICATION_WINDOW_MS = 60 * 60 * 1000;
const RESEND_VERIFICATION_MAX = 3;

export function checkResendVerificationRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const key = email.toLowerCase().trim();
  return checkRateLimit(resendVerificationMap, key, RESEND_VERIFICATION_WINDOW_MS, RESEND_VERIFICATION_MAX);
}

// Admin login (by IP)
const adminLoginMap = new Map<string, { count: number; resetAt: number }>();
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX = 10;

export function checkAdminLoginRateLimit(ip: string): boolean {
  const r = checkRateLimit(adminLoginMap, ip, ADMIN_LOGIN_WINDOW_MS, ADMIN_LOGIN_MAX);
  return r.allowed;
}

// Admin requests (by adminId)
const adminReqCount = new Map<string, { count: number; resetAt: number }>();
const ADMIN_REQ_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_REQ_MAX = 100;

export function checkAdminRateLimit(adminId: string): boolean {
  const r = checkRateLimit(adminReqCount, adminId, ADMIN_REQ_WINDOW_MS, ADMIN_REQ_MAX);
  return r.allowed;
}

// Generate (per API key or IP, 30/min)
const generateMap = new Map<string, { count: number; resetAt: number }>();
const GENERATE_WINDOW_MS = 60 * 1000;
const GENERATE_MAX = 30;

export function checkGenerateRateLimit(apiKeyOrIp: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(generateMap, apiKeyOrIp, GENERATE_WINDOW_MS, GENERATE_MAX);
}

// Top-up (per userId, 10/hour)
const topupMap = new Map<string, { count: number; resetAt: number }>();
const TOPUP_WINDOW_MS = 60 * 60 * 1000;
const TOPUP_MAX = 10;

export function checkTopupRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(topupMap, userId, TOPUP_WINDOW_MS, TOPUP_MAX);
}

// Check reactivatable (per IP, 10/hour)
const checkReactivatableMap = new Map<string, { count: number; resetAt: number }>();
const CHECK_REACTIVATABLE_WINDOW_MS = 60 * 60 * 1000;
const CHECK_REACTIVATABLE_MAX = 10;

export function checkReactivatableRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(checkReactivatableMap, ip, CHECK_REACTIVATABLE_WINDOW_MS, CHECK_REACTIVATABLE_MAX);
}

// Contact form: 5 per hour per IP
const contactFormMap = new Map<string, { count: number; resetAt: number }>();
const CONTACT_FORM_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_FORM_MAX = 5;

export function checkContactFormRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(contactFormMap, ip, CONTACT_FORM_WINDOW_MS, CONTACT_FORM_MAX);
}

// Public contact settings: 60 per minute per IP
const contactSettingsMap = new Map<string, { count: number; resetAt: number }>();
const CONTACT_SETTINGS_WINDOW_MS = 60 * 1000;
const CONTACT_SETTINGS_MAX = 60;

export function checkContactSettingsRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return checkRateLimit(contactSettingsMap, ip, CONTACT_SETTINGS_WINDOW_MS, CONTACT_SETTINGS_MAX);
}
