import { paymentsEnabled } from '@/lib/product-mode';
import { allowanceLimits } from '@/lib/free-allowance-policy';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { liveMinuteCost, photoCost } from '@/lib/try-on-policy';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (!paymentsEnabled()) return Response.json({ configured: !!process.env.DECART_API_KEY && process.env.DECART_ENABLED !== 'false', freeAccess: true, paymentsEnabled: false, dailyTryOns: allowanceLimits().visitorRequests }, { headers: { 'Cache-Control': 'no-store' } });
    const session = await getSession();
    const user = session ? await prisma.user.findUnique({ where: { id: session.userId }, select: { credits: true, tokenVersion: true, isDeleted: true } }) : null;
    const signedIn = !!(user && !user.isDeleted && user.tokenVersion === (session?.tokenVersion ?? 0));
    return Response.json({ configured: !!process.env.DECART_API_KEY && process.env.DECART_ENABLED !== 'false', freeAccess: false, paymentsEnabled: true, signedIn, credits: signedIn ? user!.credits : 0, liveCost: liveMinuteCost(), photoCost: photoCost() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('[VirtuFit] Account status unavailable');
    return Response.json({ error: 'Account status unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
