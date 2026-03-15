import { prisma } from '@/lib/db';

const KEY = 'base_api_url';

/**
 * Returns the base API URL for the app (no trailing slash).
 * Uses admin-configured value from AppSetting, then falls back to NEXT_PUBLIC_APP_URL.
 * Use in server components and API routes.
 */
export async function getBaseApiUrl(): Promise<string> {
  const row = await prisma.appSetting.findUnique({
    where: { key: KEY },
    select: { value: true },
  });
  const raw = (row?.value ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? '').trim();
  const fallback = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? 'https://virtufit-seven.vercel.app';
  if (!raw) return fallback.replace(/\/+$/, '');
  return raw.replace(/\/+$/, '');
}
