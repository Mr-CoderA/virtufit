export const LIVE_TIER = 'decart-live';
export const PHOTO_TIER = 'decart-photo';
export function positiveSetting(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}
export const liveMinuteCost = () => positiveSetting(process.env.DECART_LIVE_CREDITS_PER_MINUTE, 10);
export const photoCost = () => positiveSetting(process.env.DECART_PHOTO_CREDITS, 2);
export function liveCost(duration: number) {
  if (duration !== 30 && duration !== 60) throw new TryOnError('Choose a 30-second or 1-minute session.', 400);
  // Budget for the faster tier too: an ephemeral token cannot restrict speed.
  return Math.ceil(duration / 60 * liveMinuteCost());
}
export class TryOnError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  // Next.js can construct request.url with an internal hostname. The browser's
  // immutable Host header identifies the actual destination through the proxy.
  const destination = (request.headers.get('host') || requestUrl.host).toLowerCase();
  let parsed: URL;
  try { parsed = new URL(origin || ''); } catch { throw new TryOnError('Open VirtuFit to use this action.', 403); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.origin !== origin || parsed.host !== destination || !['http:', 'https:'].includes(parsed.protocol) || (process.env.NODE_ENV === 'production' && !local && parsed.protocol !== 'https:') || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new TryOnError('Open VirtuFit to use this action.', 403);
  }
  return origin;
}
export async function limitedBody(request: Request, max: number) {
  if (Number(request.headers.get('content-length') || 0) > max) throw new TryOnError('The upload is too large.', 413);
  if (!request.body) throw new TryOnError('Missing request body.');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new TryOnError('The upload is too large.', 413); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(parts);
}
