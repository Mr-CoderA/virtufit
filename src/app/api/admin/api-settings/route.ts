import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ['tier_credits_nano', 'tier_credits_basic', 'tier_credits_pro', 'credit_rate_cents_per_credit', 'base_api_url'] } },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const baseApiUrl = (map.base_api_url ?? process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '') || '';

  return NextResponse.json({
    replicate: { model: 'google/nano-banana-pro', version: 'pinned' },
    creditCosts: {
      nano: parseInt(map.tier_credits_nano ?? '1', 10),
      basic: parseInt(map.tier_credits_basic ?? '1', 10),
      pro: parseInt(map.tier_credits_pro ?? '3', 10),
    },
    creditRateCents: parseInt(map.credit_rate_cents_per_credit ?? '20', 10),
    baseApiUrl,
    cloudinary: { cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '***' + process.env.CLOUDINARY_CLOUD_NAME.slice(-4) : null },
    lemonSqueezy: { storeId: process.env.LEMONSQUEEZY_STORE_ID ? '***' : null },
    widget: { url: '/widget/tryon.js', version: '1.0.0' },
  });
}
