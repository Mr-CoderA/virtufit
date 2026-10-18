import { requireSameOrigin, limitedBody, liveCost, LIVE_TIER, TryOnError } from '@/lib/try-on-policy';
import { provider, reserveTryOn, failReservation, failure, type TryOnReservation } from '@/lib/try-on-service';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request: Request) {
  let reservation: TryOnReservation | undefined;
  try {
    const origin = requireSameOrigin(request);
    const client = provider();
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new TryOnError('JSON required.');
    let input;
    try { input = JSON.parse((await limitedBody(request, 2048)).toString()); } catch (e) { if (e instanceof TryOnError) throw e; throw new TryOnError('Invalid session request.'); }
    const duration = input?.duration;
    const cost = liveCost(duration);
    const log = await reserveTryOn(request, LIVE_TIER, cost, duration + 45); reservation = log;
    // Expiry prevents new dials; the separate session constraint terminates AI.
    const token = await client.tokens.create({ expiresIn: 30, allowedModels: ['lucy-vton-latest'], allowedOrigins: [origin], constraints: { realtime: { maxSessionDuration: duration } }, metadata: { app: 'VirtuFit', reservation: log.id } });
    reservation = undefined;
    return Response.json({ apiKey: token.apiKey, expiresAt: token.expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (reservation) { try { await failReservation(reservation); } catch { console.error('[VirtuFit] Token refund requires reconciliation', { reservation: reservation.id }); } }
    return failure(error, 'live token');
  }
}
