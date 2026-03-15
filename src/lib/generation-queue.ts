import Bull from 'bull';

const QUEUE_NAME = 'tryon-generation';
const attempts = parseInt(process.env.QUEUE_ATTEMPTS ?? '3', 10);
const timeoutMs = 150000; // 150s, slightly more than Replicate timeout

export type GenerationJobData = {
  jobId: string;
  userId: string;
  tier: string;
  personImageUrl: string;
  garmentImageUrls: string[];
  garmentDescription: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  creditCost: number;
  swapTarget: string;
};

let queue: Bull.Queue<GenerationJobData> | null = null;

function getRedisOpts(): string | { host: string; port: number; password?: string } | null {
  const url = process.env.REDIS_URL;
  if (url && url.startsWith('redis://')) return url;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  return { host, port, ...(password && { password }) };
}

const defaultJobOptions = {
  attempts,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
  timeout: timeoutMs,
};

function createQueue(): Bull.Queue<GenerationJobData> | null {
  const redisOpts = getRedisOpts();
  if (!redisOpts) return null;
  try {
    if (typeof redisOpts === 'string') {
      return new Bull<GenerationJobData>(QUEUE_NAME, redisOpts, { defaultJobOptions });
    }
    return new Bull<GenerationJobData>(QUEUE_NAME, { redis: redisOpts, defaultJobOptions });
  } catch {
    return null;
  }
}

/**
 * Returns the generation queue if Redis is available, otherwise null.
 * When null, the API should fall back to synchronous processing.
 */
export function getGenerationQueue(): Bull.Queue<GenerationJobData> | null {
  if (queue) return queue;
  queue = createQueue();
  return queue;
}

export async function addGenerationJob(data: GenerationJobData): Promise<Bull.Job<GenerationJobData> | null> {
  const q = getGenerationQueue();
  if (!q) return null;
  return q.add(data, { jobId: data.jobId });
}

export async function getJobCounts(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  paused: number;
} | null> {
  const q = getGenerationQueue();
  if (!q) return null;
  const counts = await q.getJobCounts();
  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    paused: 0,
  };
}

export async function closeGenerationQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
