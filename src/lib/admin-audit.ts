import { prisma } from '@/lib/db';

export async function logAdminAction(params: {
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ip: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
        ip: params.ip,
      },
    });
  } catch (e) {
    console.error('Admin audit log failed:', e);
  }
}

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function getIp(request: Request): string {
  return getClientIp(request);
}

/** Log system-triggered events (e.g. reactivation, re-registration) — no admin user. */
export async function logSystemAudit(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ip: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: 'system',
        adminEmail: 'system@virtufit.internal',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
        ip: params.ip,
      },
    });
  } catch (e) {
    console.error('System audit log failed:', e);
  }
}
