import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signature = request.headers.get('X-Signature') ?? '';
  const rawBody = await request.text();

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const digestBuf = Buffer.from(digest, 'hex');
    if (sigBuf.length !== 32 || !crypto.timingSafeEqual(digestBuf, sigBuf)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, unknown> };
    data?: { id?: string; attributes?: { total?: number; total_usd?: number } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== 'order_created') {
    return NextResponse.json({ received: true });
  }

  const customData = payload.meta?.custom_data;
  const userId = typeof customData?.user_id === 'string' ? customData.user_id : null;
  const creditsRaw = customData?.credits;
  const credits =
    typeof creditsRaw === 'number'
      ? creditsRaw
      : typeof creditsRaw === 'string'
        ? parseInt(creditsRaw, 10)
        : null;

  if (!userId || credits == null || Number.isNaN(credits) || credits < 1) {
    console.error('Webhook missing user_id or credits:', customData);
    return NextResponse.json({ error: 'Invalid custom_data' }, { status: 400 });
  }

  const orderId = typeof payload.data?.id === 'string' ? payload.data.id : null;
  const totalUsd = payload.data?.attributes?.total_usd ?? payload.data?.attributes?.total;
  const amountCents =
    typeof totalUsd === 'number' && totalUsd >= 0
      ? Math.round(totalUsd * 100)
      : Math.round((credits / 5) * 100); // 1 credit = $0.20

  try {
    if (orderId) {
      const existing = await prisma.topUp.findUnique({ where: { orderId } });
      if (existing) return NextResponse.json({ received: true });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { increment: credits },
        notifications: {
          create: {
            title: 'Credits added',
            body: `${credits} credit${credits === 1 ? '' : 's'} added to your balance from your payment.`,
          },
        },
      },
    });

    await prisma.topUp.create({
      data: {
        userId,
        credits,
        amountCents,
        ...(orderId ? { orderId } : {}),
      },
    });
  } catch (e) {
    console.error('Webhook: failed to add credits or create TopUp:', e);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
