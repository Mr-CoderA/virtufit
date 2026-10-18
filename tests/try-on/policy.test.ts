import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveCost, requireSameOrigin, limitedBody, TryOnError } from '../../src/lib/try-on-policy';
test('live sessions accept only bounded durations and reserve bounded internal units', () => {
  assert.equal(liveCost(30), 5); assert.equal(liveCost(60), 10);
  for (const input of [0, -1, 10, 120, 300, '60', null, NaN, Infinity]) assert.throws(() => liveCost(input as number), TryOnError);
});
test('AI routes reject missing and foreign origins', () => {
  const url = 'https://www.virtufit.xyz/api/tokens';
  for (const origin of [null, 'https://evil.example', 'https://virtufit.xyz']) {
    assert.throws(() => requireSameOrigin(new Request(url, { method: 'POST', headers: origin ? { origin } : {} })), TryOnError);
  }
  assert.equal(requireSameOrigin(new Request(url, { headers: { origin: 'https://www.virtufit.xyz' } })), 'https://www.virtufit.xyz');
});
test('upload limit enforces streamed bytes even with no content-length', async () => {
  const req = (body: string) => new Request('https://www.virtufit.xyz', { method: 'POST', body });
  assert.equal((await limitedBody(req('12345'), 5)).toString(), '12345');
  await assert.rejects(limitedBody(req('123456'), 5), (error: unknown) => error instanceof TryOnError && error.status === 413);
});

test('origin validation uses the immutable destination host behind Next.js routing', () => {
  const request = new Request('http://localhost:3000/api/tokens', { headers: { host: 'www.virtufit.xyz', origin: 'https://www.virtufit.xyz' } });
  assert.equal(requireSameOrigin(request), 'https://www.virtufit.xyz');
  assert.throws(() => requireSameOrigin(new Request('http://localhost:3000/api/tokens', { headers: { host: 'www.virtufit.xyz', origin: 'https://evil.example' } })), TryOnError);
});
