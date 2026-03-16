import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { clearWaitingJobs } from '@/lib/generation-queue';

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const cleared = await clearWaitingJobs();
    return NextResponse.json({ cleared, message: `Cleared ${cleared} waiting job(s).` });
  } catch (err) {
    console.warn('[admin/queues/clear] Error:', (err as Error).message);
    return NextResponse.json(
      { error: 'Failed to clear queue', details: (err as Error).message },
      { status: 500 }
    );
  }
}
