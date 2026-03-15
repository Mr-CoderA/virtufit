import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { logAdminAction, getIp } from '@/lib/admin-audit';
import { sendEmailSafe } from '@/lib/email';
import { apiKeyRotatedTemplate } from '@/lib/email-templates';
import { getContactSettings } from '@/lib/app-settings';

function generateApiKey(): string {
  const prefix = 'vf_';
  const random = crypto.randomBytes(24).toString('base64url');
  return `${prefix}${random}`;
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
  if (!user) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const newKey = generateApiKey();
  const keyHash = hashKey(newKey);
  const keyPrefix = `${newKey.slice(0, 8)}...${newKey.slice(-4)}`;

  await prisma.$transaction([
    prisma.apiKey.deleteMany({ where: { userId: id } }),
    prisma.apiKey.create({
      data: { userId: id, name: 'Default', keyPrefix, keyHash },
    }),
  ]);

  await logAdminAction({
    adminId: admin.adminId,
    adminEmail: admin.email,
    action: 'api_key_rotated',
    entityType: 'brand',
    entityId: id,
    details: null,
    ip: getIp(request),
  });

  const contact = await getContactSettings();
  const tpl = apiKeyRotatedTemplate({ name: user.name, keyPrefix, contact });
  sendEmailSafe({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  return NextResponse.json({ success: true, apiKey: newKey, message: 'Show this key once; it will not be shown again.' });
}
