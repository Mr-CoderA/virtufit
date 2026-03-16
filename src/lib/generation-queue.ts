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

function parseRedisUrl(url: string): { host: string; port: number; password?: string; tls?: object } | null {
  try {
    const parsed = new URL(url);
    const port = parsed.port ? parseInt(parsed.port, 10) : 6379;
    const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
    const host = parsed.hostname;
    if (!host) return null;
    const useTls = parsed.protocol === 'rediss:';
    return {
      host,
      port: Number.isNaN(port) ? 6379 : port,
      ...(password && { password }),
      ...(useTls && { tls: { rejectUnauthorized: true } }),
    };
  } catch {
    return null;
  }
}

function getRedisOpts(): string | { host: string; port: number; password?: string; tls?: object } | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    const host = process.env.REDIS_HOST ?? 'localhost';
    const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
    const password = process.env.REDIS_PASSWORD?.trim() || undefined;
    return { host, port, ...(password && { password }) };
  }
  // rediss:// (TLS) e.g. Upstash: use parsed options with explicit TLS so connection succeeds
  if (url.startsWith('rediss://')) {
    const opts = parseRedisUrl(url);
    return opts ?? { host: 'localhost', port: 6379 };
  }
  if (url.startsWith('redis://')) return url;
  return null;
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

/**
 * Remove all waiting (and delayed) jobs from the queue. Returns number of jobs removed.
 * Use for clearing stuck jobs when no worker is running.
 */
export async function clearWaitingJobs(): Promise<number> {
  const q = getGenerationQueue();
  if (!q) return 0;
  const [waiting, delayed] = await Promise.all([q.getWaiting(), q.getDelayed()]);
  let removed = 0;
  for (const job of [...waiting, ...delayed]) {
    try {
      await job.remove();
      removed++;
    } catch {
      // ignore
    }
  }
  return removed;
}
