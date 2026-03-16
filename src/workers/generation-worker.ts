/**
 * Standalone worker process for try-on generation jobs.
 * Run with: npx tsx src/workers/generation-worker.ts
 * Requires: REDIS_URL or REDIS_HOST/REDIS_PORT, DATABASE_URL, REPLICATE_API_TOKEN
 */
import 'dotenv/config';
import Bull from 'bull';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateTryOn } from '@/lib/replicate';
import { deliverWebhook } from '@/lib/webhook-delivery';
import type { GenerationJobData } from '@/lib/generation-queue';
import { logger } from '@/lib/logger';
import { sendEmailSafe } from '@/lib/email';
import { lowCreditsTemplate } from '@/lib/email-templates';

const RATE_LIMIT_DELAY_MS = 12_000;

let connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
if (!connectionString.includes('sslmode=') && !connectionString.includes('localhost')) {
  connectionString += connectionString.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full';
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function getRedisOpts(): string | { host: string; port: number; password?: string } {
  const url = process.env.REDIS_URL?.trim();
  // Accept both redis:// and rediss:// (TLS); Upstash uses rediss://
  if (url && (url.startsWith('redis://') || url.startsWith('rediss://'))) return url;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  return { host, port, ...(password && { password }) };
}

const redisOpts = getRedisOpts();
const defaultJobOptions = {
  attempts: parseInt(process.env.QUEUE_ATTEMPTS ?? '3', 10),
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
  timeout: 150000,
};
const generationQueue =
  typeof redisOpts === 'string'
    ? new Bull<GenerationJobData>('tryon-generation', redisOpts, { defaultJobOptions })
    : new Bull<GenerationJobData>('tryon-generation', { redis: redisOpts, defaultJobOptions });

const concurrency = Math.max(1, parseInt(process.env.QUEUE_CONCURRENCY ?? '5', 10));

async function processJob(job: Bull.Job<GenerationJobData>): Promise<void> {
  const data = job.data;
  const startedAt = new Date();

  await prisma.generationJob.update({
    where: { id: data.jobId },
    data: { status: 'processing', startedAt },
  });

  const creditPerRun = data.tier === 'pro' ? 3 : 1;
  const results: { outputUrls: string[]; jobId: string }[] = [];

  for (let i = 0; i < data.garmentImageUrls.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    const result = await generateTryOn({
      personImageUrl: data.personImageUrl,
      garmentImageUrls: [data.garmentImageUrls[i]],
      tier: data.tier as 'nano' | 'basic' | 'pro',
      garmentDescription: data.garmentDescription ?? undefined,
      swapTarget: data.swapTarget ?? 'full_outfit',
    });
    if (result.error || result.outputUrls.length === 0) {
      const errMsg = result.error ?? 'No output';
      await prisma.generationJob.update({
        where: { id: data.jobId },
        data: {
          status: 'failed',
          errorMessage: errMsg,
          completedAt: new Date(),
          attempts: job.attemptsMade + 1,
        },
      });
      if (data.webhookUrl) {
        await deliverWebhook(
          data.webhookUrl,
          {
            event: 'tryon.failed',
            job_id: data.jobId,
            status: 'failed',
            error: errMsg,
            credits_used: 0,
            attempts: job.attemptsMade + 1,
            timestamp: new Date().toISOString(),
          },
          data.webhookSecret
        );
      }
      throw new Error(errMsg);
    }
    results.push({ outputUrls: result.outputUrls, jobId: result.jobId });
  }

  const allOutputUrls = results.flatMap((r) => r.outputUrls);
  const processingMs = Date.now() - startedAt.getTime();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: data.userId },
      data: { credits: { decrement: data.creditCost } },
    }),
    ...results.map((r, i) =>
      prisma.usageLog.create({
        data: {
          userId: data.userId,
          tier: data.tier,
          creditsUsed: creditPerRun,
          jobId: r.jobId,
          outputUrl: r.outputUrls[0] ?? allOutputUrls[i],
        },
      })
    ),
    prisma.generationJob.update({
      where: { id: data.jobId },
      data: {
        status: 'completed',
        outputUrls: allOutputUrls,
        completedAt: new Date(),
        processingMs,
        replicateJobId: results[0]?.jobId ?? null,
      },
    }),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { credits: true, email: true, name: true },
  });
  const creditsRemaining = updatedUser?.credits ?? 0;

  if (creditsRemaining < 5 && updatedUser) {
    const tpl = lowCreditsTemplate({ name: updatedUser.name, balance: creditsRemaining });
    sendEmailSafe({ to: updatedUser.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  if (data.webhookUrl) {
    await deliverWebhook(
      data.webhookUrl,
      {
        event: 'tryon.completed',
        job_id: data.jobId,
        status: 'completed',
        output_urls: allOutputUrls,
        output_url: allOutputUrls[0],
        tier: data.tier,
        credits_used: data.creditCost,
        credits_remaining: creditsRemaining,
        processing_ms: processingMs,
        timestamp: new Date().toISOString(),
      },
      data.webhookSecret
    );
  }
}

generationQueue.process(concurrency, async (job) => {
  await processJob(job);
});

generationQueue.on('completed', (job) => {
  logger.info('Generation job completed', { jobId: job.id });
});

generationQueue.on('failed', (job, err) => {
  logger.error('Generation job failed', { jobId: job?.id, error: err?.message });
});

generationQueue.on('error', (err) => {
  logger.error('Queue error', { err: err?.message });
});

async function shutdown() {
  logger.info('Shutting down worker gracefully...');
  await generationQueue.pause();
  const active = await generationQueue.getActiveCount();
  if (active > 0) {
    logger.info(`Waiting for ${active} active job(s) to complete (max 30s)...`);
    await new Promise((r) => setTimeout(r, 30000));
  }
  await generationQueue.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info(`Generation worker started (concurrency: ${concurrency})`);
