import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { getBaseApiUrl } from '@/lib/base-api-url';

const LEMONSQUEEZY_API = 'https://api.lemonsqueezy.com/v1/checkouts';

export async function POST(request: Request) {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const session = validation.session;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    console.error('Lemon Squeezy: missing env (LEMONSQUEEZY_API_KEY, STORE_ID, VARIANT_ID)');
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    );
  }

  const CREDIT_PER_DOLLAR = 5; // 1 credit = $0.20, so $1 = 5 credits

  try {
    const body = await request.json();
    const amount =
      typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount).replace(/,/g, ''));

    if (Number.isNaN(amount) || amount < 0.2 || amount > 9999) {
      return NextResponse.json(
        { error: 'Amount must be between $0.20 and $9999 USD' },
        { status: 400 }
      );
    }

    const credits = Math.floor(amount * CREDIT_PER_DOLLAR); // 1 credit = $0.20
    if (credits < 1) {
      return NextResponse.json(
        { error: 'Minimum purchase is $0.20 (1 credit)' },
        { status: 400 }
      );
    }
    const customPriceCents = Math.round(amount * 100);

    const baseUrl = await getBaseApiUrl();
    const redirectUrl = `${baseUrl}/dashboard?topup=success`;

    const res = await fetch(LEMONSQUEEZY_API, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: customPriceCents,
            product_options: {
              enabled_variants: [parseInt(variantId, 10)],
              redirect_url: redirectUrl,
              receipt_link_url: redirectUrl,
            },
            checkout_data: {
              custom: {
                user_id: session.userId,
                credits: String(credits),
              },
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId },
            },
            variant: {
              data: { type: 'variants', id: variantId },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Lemon Squeezy checkout error:', res.status, err);
      return NextResponse.json(
        { error: 'Could not create checkout' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const url = data?.data?.attributes?.url;
    if (!url) {
      return NextResponse.json(
        { error: 'Invalid checkout response' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error('Create checkout error:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
