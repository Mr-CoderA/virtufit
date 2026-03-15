type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const currentLevel: LogLevel = (process.env.NODE_ENV === 'production' ? 'info' : 'debug') as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatMsg(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length > 0 ? ' ' + JSON.stringify(sanitizeMeta(meta)) : '';
  return `${ts} [${level.toUpperCase()}] ${message}${metaStr}`;
}

/** Never log passwords, full API keys, or JWTs. */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const sensitive = ['password', 'passwordHash', 'apiKey', 'token', 'authorization', 'cookie'];
  for (const [k, v] of Object.entries(meta)) {
    const keyLower = k.toLowerCase();
    if (sensitive.some((s) => keyLower.includes(s))) {
      out[k] = '[REDACTED]';
      continue;
    }
    if (k === 'apiKeyPrefix' && typeof v === 'string') out[k] = v.length > 8 ? v.slice(0, 8) + '...' : v;
    else out[k] = v;
  }
  return out;
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('error')) console.error(formatMsg('error', message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) console.warn(formatMsg('warn', message, meta));
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) console.log(formatMsg('info', message, meta));
  },
  http(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('http')) console.log(formatMsg('http', message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) console.log(formatMsg('debug', message, meta));
  },
  security(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) console.warn(formatMsg('warn', `[SECURITY] ${message}`, sanitizeMeta(meta ?? {})));
  },
};
