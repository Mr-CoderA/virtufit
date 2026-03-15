import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { getJobCounts } from '@/lib/generation-queue';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const counts = await getJobCounts();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [completedToday, failedToday] = await Promise.all([
    prisma.generationJob.count({ where: { status: 'completed', completedAt: { gte: todayStart } } }),
    prisma.generationJob.count({ where: { status: 'failed', completedAt: { gte: todayStart } } }),
  ]);

  return NextResponse.json({
    queue: counts ?? { waiting: 0, active: 0, completed: 0, failed: 0, paused: 0 },
    completedToday,
    failedToday,
    workersActive: counts ? counts.active : 0,
  });
}
