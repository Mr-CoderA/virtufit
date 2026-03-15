import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const plans = await prisma.plan.findMany({
    orderBy: { key: 'asc' },
    select: { id: true, name: true, key: true, welcomeCredits: true, features: true, status: true, updatedAt: true, updatedBy: true },
  });

  return NextResponse.json({ plans });
}
