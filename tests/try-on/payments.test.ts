import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

test('disabled checkout refuses anonymous and authenticated-looking requests before any payment call', async () => {
  process.env.DATABASE_URL ||= 'postgresql://local:local@localhost:5432/test_unused';
  process.env.PAYMENTS_ENABLED = 'false';
  const { POST } = await import('../../src/app/api/topup/create-checkout/route');
  const originalFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('External payment must not be called'); };
  try {
    for (const cookie of ['', 'session=fake']) {
      const response = await POST(new Request('https://www.virtufit.xyz/api/topup/create-checkout', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ amount: 20 }) }));
      assert.equal(response.status, 403); assert.equal((await response.json()).code, 'PAYMENTS_DISABLED');
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
test('turning off checkout preserves webhook authentication and acceptance of legitimate callbacks', async () => {
  process.env.DATABASE_URL ||= 'postgresql://local:local@localhost:5432/test_unused';
  process.env.PAYMENTS_ENABLED = 'false';
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'disposable-webhook-fixture-secret';
  const { POST } = await import('../../src/app/api/topup/webhook/route');
  const body = JSON.stringify({ meta: { event_name: 'subscription_updated' } });
  const url = 'https://www.virtufit.xyz/api/topup/webhook';
  const denied = await POST(new Request(url, { method: 'POST', body, headers: { 'x-signature': 'bad' } }));
  assert.equal(denied.status, 401);
  const signature = createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  const accepted = await POST(new Request(url, { method: 'POST', body, headers: { 'x-signature': signature } }));
  assert.equal(accepted.status, 200); assert.deepEqual(await accepted.json(), { received: true });
});
