import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const res = await fetch('https://api.replicate.com/v1/models/google/nano-banana-pro', {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN ?? ''}` },
    });
    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Replicate connection OK' });
    }
    return NextResponse.json({ success: false, message: `Replicate returned ${res.status}` }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : 'Connection failed' }, { status: 502 });
  }
}
