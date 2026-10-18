import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paymentsEnabled } from '../../src/lib/product-mode';
import { applyAllowance, emptyAllowance } from '../../src/lib/free-allowance-policy';
const input = { id: 'request1', visitor: 'browser1', network: 'network1', units: 5, holdSeconds: 30, now: 1000 };
const limits = { requests: 50, units: 100, visitorRequests: 5, networkRequests: 10, concurrent: 2 };
test('payments are off by default and require an explicit server-side true', () => {
 const previous = process.env.PAYMENTS_ENABLED;
 try { for (const value of [undefined, '', 'false', '1', 'TRUE']) { if (value === undefined) delete process.env.PAYMENTS_ENABLED; else process.env.PAYMENTS_ENABLED = value; assert.equal(paymentsEnabled(), false); } process.env.PAYMENTS_ENABLED = 'true'; assert.equal(paymentsEnabled(), true); }
 finally { if (previous === undefined) delete process.env.PAYMENTS_ENABLED; else process.env.PAYMENTS_ENABLED = previous; }
});
test('anonymous reservation needs no user, email or balance and leaves the source state unchanged', () => {
 const state = emptyAllowance(); const next = applyAllowance(state, input, limits);
 assert.equal(next.requests, 1); assert.equal(next.visitors.browser1.requests, 1); assert.equal(state.requests, 0);
});
test('cookie resets cannot bypass the shared network allowance', () => {
 const state = { ...emptyAllowance(), networks: { network1: 10 } };
 assert.throws(() => applyAllowance(state, { ...input, visitor: 'new-cookie' }, limits), /network/);
});
test('daily browser, global request, unit and concurrency caps fail closed', () => {
 assert.throws(() => applyAllowance({ ...emptyAllowance(), visitors: { browser1: { requests: 5, units: 5 } } }, input, limits), /daily|today/i);
 assert.throws(() => applyAllowance({ ...emptyAllowance(), requests: 50 }, input, limits), /allowance/);
 assert.throws(() => applyAllowance({ ...emptyAllowance(), units: 99 }, input, limits), /allowance/);
 const active = { one: { visitor: 'a', until: 5000 }, two: { visitor: 'b', until: 5000 } };
 assert.throws(() => applyAllowance({ ...emptyAllowance(), active }, input, limits), /busy/);
});
test('active browser holds prevent overlap, expired holds release capacity, attempts remain counted', () => {
 const one = applyAllowance(emptyAllowance(), input, limits);
 assert.throws(() => applyAllowance(one, { ...input, id: 'overlap' }, limits), /previous/);
 const two = applyAllowance(one, { ...input, id: 'second', now: 32000 }, limits);
 assert.equal(two.requests, 2); assert.equal(two.units, 10); assert.equal(Object.keys(two.active).length, 1);
});
