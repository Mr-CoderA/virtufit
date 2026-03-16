import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { getJobCounts } from '@/lib/generation-queue';
import { prisma } from '@/lib/db';

const fallbackCounts = { waiting: 0, active: 0, completed: 0, failed: 0, paused: 0 };
const REDIS_TIMEOUT_MS = 4000; // keep response fast; if Redis is slow (e.g. cold start), show fallback

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  let counts: Awaited<ReturnType<typeof getJobCounts>> = null;
  try {
    // Don't hang for Redis retries (e.g. 3+ min); give up after REDIS_TIMEOUT_MS and return fallback
    let timeoutId: ReturnType<typeof setTimeout>;
    counts = await Promise.race([
      getJobCounts().then((c) => {
        clearTimeout(timeoutId);
        return c;
      }),
      new Promise<Awaited<ReturnType<typeof getJobCounts>>>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Redis timeout')), REDIS_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    // Redis down, unreachable, or timeout — return fallback so admin UI doesn't 500
    console.warn('[admin/queues/stats] Redis unavailable, returning fallback counts:', (err as Error).message);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [completedToday, failedToday] = await Promise.all([
    prisma.generationJob.count({ where: { status: 'completed', completedAt: { gte: todayStart } } }),
    prisma.generationJob.count({ where: { status: 'failed', completedAt: { gte: todayStart } } }),
  ]);

  return NextResponse.json({
    queue: counts ?? fallbackCounts,
    completedToday,
    failedToday,
    workersActive: counts ? counts.active : 0,
  });
}
