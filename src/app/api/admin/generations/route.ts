import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { getJobCounts } from '@/lib/generation-queue';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const brandId = searchParams.get('brandId') ?? undefined;
  const tier = searchParams.get('tier'); // All | nano | basic | pro
  const status = searchParams.get('status'); // All | Success | Failed | Timeout
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let queueCounts: Awaited<ReturnType<typeof getJobCounts>> = null;
  try {
    queueCounts = await getJobCounts();
  } catch {
    // Redis unreachable — use zeros for queue stats
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [completedToday, failedToday] = await Promise.all([
    prisma.generationJob.count({ where: { status: 'completed', completedAt: { gte: todayStart } } }),
    prisma.generationJob.count({ where: { status: 'failed', completedAt: { gte: todayStart } } }),
  ]);

  const queueStats = {
    queued: queueCounts?.waiting ?? 0,
    processing: queueCounts?.active ?? 0,
    completedToday,
    failedToday,
    workersActive: queueCounts?.active ?? 0,
  };

  const where: Prisma.UsageLogWhereInput = {
    tier: { in: ['nano', 'basic', 'pro'] },
    jobId: { not: null },
  };
  if (brandId) where.userId = brandId;
  if (tier && tier !== 'All') where.tier = tier;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as { gte?: Date }).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as { lte?: Date }).lte = new Date(dateTo);
  }

  const [logs, total, activeJobs] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, userId: true, tier: true, creditsUsed: true, jobId: true, outputUrl: true, createdAt: true },
    }),
    prisma.usageLog.count({ where }),
    prisma.generationJob.findMany({
      where: { status: { in: ['queued', 'processing'] } },
      orderBy: { queuedAt: 'asc' },
      take: 50,
      select: { id: true, userId: true, tier: true, status: true, queuedAt: true, startedAt: true },
    }),
  ]);

  const userIds = [...new Set([...logs.map((l) => l.userId), ...activeJobs.map((j) => j.userId)])];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const items = logs.map((l) => ({
    ...l,
    brand: userMap[l.userId]?.name ?? userMap[l.userId]?.email ?? l.userId,
    status: 'Success',
  }));

  const activeJobsWithBrand = activeJobs.map((j) => ({
    id: j.id,
    userId: j.userId,
    tier: j.tier,
    status: j.status,
    queuedAt: j.queuedAt.toISOString(),
    startedAt: j.startedAt?.toISOString() ?? null,
    brand: userMap[j.userId]?.name ?? userMap[j.userId]?.email ?? j.userId,
  }));

  return NextResponse.json({ items, total, page, limit, queueStats, activeJobs: activeJobsWithBrand });
}
