import crypto from 'node:crypto';
import { prisma } from '@/lib/db';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export type ApiKeyUser = { id: string; credits: number; name: string | null; suspended: boolean };

/**
 * Validates X-API-Key header and returns the owning user (and updates lastUsedAt).
 * Returns null if key is missing or invalid.
 * Caller must check user.suspended and return 401 with account suspended message if true.
 */
export async function getUserIdFromApiKey(apiKeyRaw: string | null): Promise<ApiKeyUser | null> {
  if (!apiKeyRaw || typeof apiKeyRaw !== 'string') return null;
  const trimmed = apiKeyRaw.trim();
  if (!trimmed) return null;

  const keyHash = hashKey(trimmed);

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash },
    select: { id: true, userId: true, user: { select: { id: true, credits: true, name: true, suspended: true, isDeleted: true } } },
  });

  if (!apiKey) return null;
  if (apiKey.user.isDeleted) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: apiKey.user.id,
    credits: apiKey.user.credits,
    name: apiKey.user.name ?? null,
    suspended: apiKey.user.suspended,
  };
}
