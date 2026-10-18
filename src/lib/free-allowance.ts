import 'server-only';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { applyAllowance, emptyAllowance, type AllowanceState } from './free-allowance-policy';

function digest(value: string) {
  const key = process.env.JWT_SECRET;
  if (!key || key.length < 32) throw new Error('Visitor signing key unavailable');
  return createHmac('sha256', key).update(value).digest('hex');
}
export async function visitorIdentity(request: Request) {
  const jar = await cookies();
  const existing = jar.get('vf_visitor')?.value ?? '';
  const [candidate, signature] = existing.split('.');
  let id = '';
  if (/^[a-f0-9-]{36}$/.test(candidate ?? '') && /^[a-f0-9]{64}$/.test(signature ?? '') && timingSafeEqual(Buffer.from(signature), Buffer.from(digest(`cookie:${candidate}`)))) id = candidate;
  if (!id) {
    id = randomUUID();
    jar.set('vf_visitor', `${id}.${digest(`cookie:${id}`)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 86400 });
  }
  const day = new Date().toISOString().slice(0, 10);
  // Vercel overwrites x-forwarded-for at its ingress. Do not use a client-supplied
  // visitor ID as the network limit; clearing cookies must not reset it.
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return { visitor: digest(`visitor:${day}:${id}`), network: digest(`network:${day}:${ip}`), day };
}
export async function reserveFree(request: Request, units: number, holdSeconds: number) {
  const identity = await visitorIdentity(request);
  const id = randomUUID(); const key = `virtufit:free:v1:${identity.day}`;
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(192731, 4318)`;
    const row = await tx.appSetting.findUnique({ where: { key } });
    const state: AllowanceState = row ? JSON.parse(row.value) : emptyAllowance();
    const next = applyAllowance(state, { ...identity, id, units, holdSeconds, now: Date.now() });
    await tx.appSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(next), updatedAt: new Date() }, update: { value: JSON.stringify(next), updatedAt: new Date() } });
    // Retain seven days of pseudonymous operational counters; never raw IPs,
    // photos or customer data. Existing app settings and billing are untouched.
    const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    await tx.appSetting.deleteMany({ where: { key: { startsWith: 'virtufit:free:v1:', lt: `virtufit:free:v1:${cutoff}` } } });
  }, { maxWait: 10000, timeout: 15000 });
  return { kind: 'free' as const, id, key };
}
export async function finishFree(key: string, id: string) {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(192731, 4318)`;
    const row = await tx.appSetting.findUnique({ where: { key } });
    if (!row) return;
    const state: AllowanceState = JSON.parse(row.value);
    delete state.active[id];
    // Attempts and units stay counted after failures to prevent retry abuse.
    await tx.appSetting.update({ where: { key }, data: { value: JSON.stringify(state), updatedAt: new Date() } });
  });
}
