import { NextResponse } from 'next/server';
import { getSessionAndValidate } from '@/lib/auth';
import { getUserIdFromApiKey } from '@/lib/auth-api-key';
import { prisma } from '@/lib/db';
import { getGenerationQueue } from '@/lib/generation-queue';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
  }

  const apiKey = request.headers.get('X-API-Key');
  let userId: string | null = null;
  const apiUser = await getUserIdFromApiKey(apiKey);
  if (apiUser) {
    if (!apiUser.emailVerified) {
      return NextResponse.json(
        { error: 'Account not activated', message: 'Please verify your email address to use the API.' },
        { status: 401 }
      );
    }
    userId = apiUser.id;
  } else {
    const validation = await getSessionAndValidate();
    if (validation.valid) userId = validation.session.userId;
    if (!validation.valid && 'deleted' in validation && validation.deleted) {
      return NextResponse.json(
        { error: 'Account deleted', code: 'ACCOUNT_DELETED' },
        { status: 401 }
      );
    }
  }
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId },
    select: {
      id: true,
      status: true,
      tier: true,
      outputUrls: true,
      creditCost: true,
      errorMessage: true,
      attempts: true,
      queuedAt: true,
      startedAt: true,
      completedAt: true,
      processingMs: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const base = {
    job_id: job.id,
    status: job.status,
  };

  if (job.status === 'queued') {
    let position = 0;
    const queue = getGenerationQueue();
    if (queue) {
      try {
        const waiting = await queue.getWaitingCount();
        const jobs = await queue.getWaiting(0, waiting);
        const idx = jobs.findIndex((j) => (j as { id?: string; data?: { jobId?: string } }).data?.jobId === jobId || String((j as { id?: unknown }).id) === jobId);
        if (idx >= 0) position = idx + 1;
      } catch {
        // ignore
      }
    }
    return NextResponse.json({
      ...base,
      position,
      queued_at: job.queuedAt.toISOString(),
      estimated_seconds: 15 + (position > 0 ? position * 12 : 0),
    });
  }

  if (job.status === 'processing') {
    const started = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
    return NextResponse.json({
      ...base,
      started_at: job.startedAt?.toISOString(),
      elapsed_seconds: Math.floor((Date.now() - started) / 1000),
    });
  }

  if (job.status === 'completed') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return NextResponse.json({
      ...base,
      output_urls: job.outputUrls,
      output_url: job.outputUrls[0] ?? null,
      tier: job.tier,
      credits_used: job.creditCost,
      credits_remaining: user?.credits ?? 0,
      processing_ms: job.processingMs,
      completed_at: job.completedAt?.toISOString(),
    });
  }

  if (job.status === 'failed') {
    return NextResponse.json({
      ...base,
      error: job.errorMessage ?? 'Generation failed',
      retryable: true,
      credits_used: 0,
      failed_at: job.completedAt?.toISOString(),
      attempts: job.attempts,
    });
  }

  return NextResponse.json({ ...base });
}
