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
  const raw = (row?.value ?? process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
  if (!raw) return 'https://api.virtufit.com';
  return raw.replace(/\/+$/, '');
}
