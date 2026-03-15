import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const search = (searchParams.get('search') ?? '').trim();
  const plan = searchParams.get('plan'); // All | FREE | ENTERPRISE
  const status = searchParams.get('status'); // All | Active | Inactive
  const sort = searchParams.get('sort') ?? 'newest'; // newest | oldest | most_credits | most_generations
  const showDeleted = searchParams.get('showDeleted') === 'true';

  let where: Prisma.UserWhereInput = { isDeleted: showDeleted };
  if (search) {
    where = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { apiKeys: { some: { keyPrefix: { startsWith: search } } } },
      ],
    };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (status === 'Active') {
    where = { ...where, usageLogs: { some: { createdAt: { gte: sevenDaysAgo } } } };
  } else if (status === 'Inactive') {
    where = { ...where, NOT: { usageLogs: { some: { createdAt: { gte: sevenDaysAgo } } } } };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const orderBy: Record<string, 'asc' | 'desc'> =
    sort === 'oldest' ? { createdAt: 'asc' } :
    sort === 'most_credits' ? { credits: 'desc' } :
    { createdAt: 'desc' };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        createdAt: true,
        suspended: true,
        suspendedAt: true,
        isDeleted: true,
        deletedAt: true,
        deletedBy: true,
        deletedReason: true,
        _count: { select: { usageLogs: true } },
        usageLogs: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
    }),
    prisma.user.count({ where: Object.keys(where).length ? where : undefined }),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    name: u.name ?? u.email,
    email: u.email,
    plan: 'FREE',
    credits: u.credits,
    generations30d: u._count.usageLogs,
    joinedAt: u.createdAt,
    lastActive: u.usageLogs[0]?.createdAt ?? null,
    suspended: u.suspended,
    isDeleted: u.isDeleted,
    deletedAt: u.deletedAt?.toISOString() ?? null,
    deletedBy: u.deletedBy ?? null,
    deletedReason: u.deletedReason ?? null,
  }));

  return NextResponse.json({ items, total, page, limit });
}
