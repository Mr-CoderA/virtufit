import 'server-only';
import { createDecartClient } from '@decartai/sdk';
import { paymentsEnabled } from './product-mode';
import { reserveFree, finishFree } from './free-allowance';
import { prisma } from './db';
import { getSession } from './auth';
import { TryOnError, positiveSetting, LIVE_TIER, PHOTO_TIER } from './try-on-policy';

export function provider() {
  const apiKey = process.env.DECART_API_KEY?.trim();
  if (!apiKey || process.env.DECART_ENABLED === 'false') throw new TryOnError('AI try-on is temporarily unavailable. Please try again later.', 503);
  return createDecartClient({ apiKey, telemetry: false });
}
export async function requireTryOnUser() {
  const session = await getSession();
  if (!session) throw new TryOnError('Sign in to VirtuFit to use AI try-on.', 401);
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isDeleted || user.tokenVersion !== (session.tokenVersion ?? 0)) throw new TryOnError('Please sign in again.', 401);
  if (user.suspended) throw new TryOnError('This account cannot use AI try-on. Contact support.', 403);
  if (!user.emailVerified) throw new TryOnError('Verify your email before using AI try-on.', 403);
  return user;
}
export async function reserve(userId: string, tier: string, cost: number, holdSeconds: number) {
  return prisma.$transaction(async tx => {
    // A database lock serializes budget checks across every Vercel instance.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(192731, 4317)`;
    const now = new Date();
    const today = new Date(now); today.setUTCHours(0, 0, 0, 0);
    const tiers = { in: [LIVE_TIER, PHOTO_TIER] };
    const usage = await tx.usageLog.findMany({ where: { tier: tiers, createdAt: { gte: today } }, select: { userId: true, creditsUsed: true, note: true, createdAt: true } });
    const total = usage.reduce((n, u) => n + u.creditsUsed, 0);
    const own = usage.filter(u => u.userId === userId);
    // Failed provider attempts still consume request allowance, so refunds cannot
    // be used to make unlimited upstream requests.
    if (usage.length >= positiveSetting(process.env.DECART_DAILY_REQUEST_LIMIT, 50) || own.length >= positiveSetting(process.env.DECART_USER_DAILY_REQUEST_LIMIT, 10)) throw new TryOnError('Today’s try-on request allowance is reached. Please return tomorrow.', 429);

    if (total + cost > positiveSetting(process.env.DECART_DAILY_CREDIT_LIMIT, 100)) throw new TryOnError('Today’s AI allowance is reached. Please return tomorrow.', 429);
    if (own.reduce((n, u) => n + u.creditsUsed, 0) + cost > positiveSetting(process.env.DECART_USER_DAILY_CREDIT_LIMIT, 40)) throw new TryOnError('Your daily AI allowance is reached. Please return tomorrow.', 429);
    // Holds include token validity and connection time. Do not release live holds
    // based on an untrusted browser stop callback.
    const recent = await tx.usageLog.findFirst({ where: { userId, tier: tiers, createdAt: { gt: new Date(now.getTime() - 180_000) }, note: { startsWith: 'hold:' } }, orderBy: { createdAt: 'desc' } });
    if (recent && Number(recent.note?.slice(5)) > now.getTime()) throw new TryOnError('A try-on is already being prepared or running. Wait for it to finish.', 429);
    const changed = await tx.user.updateMany({ where: { id: userId, credits: { gte: cost }, suspended: false, isDeleted: false, emailVerified: true }, data: { credits: { decrement: cost } } });
    if (changed.count !== 1) throw new TryOnError('Not enough VirtuFit credits. Add credits from your dashboard.', 402);
    return tx.usageLog.create({ data: { userId, tier, creditsUsed: cost, note: `hold:${now.getTime() + holdSeconds * 1000}` } });
  }, { maxWait: 10000, timeout: 15000 });
}
export async function refund(id: string) {
  await prisma.$transaction(async tx => {
    const log = await tx.usageLog.findUnique({ where: { id } });
    if (!log) return;
    const changed = await tx.usageLog.updateMany({ where: { id, creditsUsed: { gt: 0 } }, data: { creditsUsed: 0, note: 'Provider request failed; credits restored.' } });
    if (changed.count) await tx.user.update({ where: { id: log.userId }, data: { credits: { increment: log.creditsUsed } } });
  });
}
export function failure(error: unknown, action: string) {
  if (error instanceof TryOnError) return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  // No provider response bodies, tokens, personal photos or credentials in logs.
  console.error(`[VirtuFit] ${action} failed`, { type: error instanceof Error ? error.name : 'UnknownError' });
  return Response.json({ error: 'AI try-on could not finish. Please try again shortly.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

export type TryOnReservation = { kind: 'paid'; id: string } | Awaited<ReturnType<typeof reserveFree>>;
export async function reserveTryOn(request: Request, tier: string, units: number, holdSeconds: number): Promise<TryOnReservation> {
  if (!paymentsEnabled()) return reserveFree(request, units, holdSeconds);
  const user = await requireTryOnUser();
  const log = await reserve(user.id, tier, units, holdSeconds);
  return { kind: 'paid', id: log.id };
}
export async function failReservation(reservation: TryOnReservation) {
  if (reservation.kind === 'free') await finishFree(reservation.key, reservation.id);
  else await refund(reservation.id);
}
export async function completePhoto(reservation: TryOnReservation) {
  if (reservation.kind === 'free') await finishFree(reservation.key, reservation.id);
  else await prisma.usageLog.update({ where: { id: reservation.id }, data: { note: 'Photo generated. Images are not stored by VirtuFit.' } });
}
