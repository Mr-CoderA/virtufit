import crypto from 'node:crypto';

const RETRY_DELAYS_MS = [5000, 25000, 125000]; // 5s, 25s, 125s
const SIGNATURE_HEADER = 'X-VirtuFit-Signature';

function signPayload(body: string, secret: string | null): string | null {
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function deliverWebhook(
  url: string,
  payload: object,
  secret: string | null
): Promise<{ ok: boolean; status?: number }> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'VirtuFit-Webhook/1.0',
  };
  if (signature) headers[SIGNATURE_HEADER] = signature;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok || res.status >= 500) {
        if (!res.ok && attempt < RETRY_DELAYS_MS.length) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        return { ok: res.ok, status: res.status };
      }
      return { ok: false, status: res.status };
    } catch {
      clearTimeout(timeoutId);
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      } else {
        return { ok: false };
      }
    }
  }
  return { ok: false };
}
