import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get('countOnly') === '1';
  if (countOnly) {
    const unreadCount = await prisma.contactSubmission.count({ where: { read: false } });
    return NextResponse.json({ unreadCount });
  }
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const skip = (page - 1) * limit;
  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.contactSubmission.count(),
  ]);
  const unreadCount = await prisma.contactSubmission.count({ where: { read: false } });
  return NextResponse.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      brand: s.brand,
      platform: s.platform,
      subject: s.subject,
      message: s.message,
      read: s.read,
      createdAt: s.createdAt.toISOString(),
    })),
    total,
    unreadCount,
  });
}
