import Redis from 'ioredis';

let redis: Redis | null = null;

export type RedisConfig =
  | string
  | {
      host: string;
      port: number;
      password?: string;
    };

function getRedisConfig(): RedisConfig | null {
  const url = process.env.REDIS_URL?.trim();
  // Accept both redis:// and rediss:// (TLS); Upstash uses rediss://
  if (url && (url.startsWith('redis://') || url.startsWith('rediss://'))) return url;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  return { host, port, password };
}

/**
 * Get a Redis client. Returns null if Redis is not configured or connection fails.
 * Used by the generation queue; if null, API falls back to synchronous processing.
 */
export function getRedis(): Redis | null {
  if (redis) return redis;
  const config = getRedisConfig();
  if (!config) return null;
  try {
    redis = typeof config === 'string'
      ? new Redis(config, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
        })
      : new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
        });
    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });
    return redis;
  } catch {
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
