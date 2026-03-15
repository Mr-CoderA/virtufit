import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  await prisma.contactSubmission.update({
    where: { id },
    data: { read: true },
  });
  return NextResponse.json({ success: true });
}
