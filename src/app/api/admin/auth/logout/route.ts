import { NextResponse } from 'next/server';
import { verifyAdminToken, getAdminTokenFromRequest } from '@/lib/auth-admin';

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const admin = await verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
