import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_RESOLUTIONS = ['1K', '2K', '4K'] as const;

export async function POST(request: Request) {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { preferredResolution } = body;

    if (
      !preferredResolution ||
      !VALID_RESOLUTIONS.includes(preferredResolution as (typeof VALID_RESOLUTIONS)[number])
    ) {
      return NextResponse.json(
        { error: 'Invalid resolution. Choose 1K, 2K, or 4K.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: validation.session.userId },
      data: { preferredResolution },
    });

    return NextResponse.json({ success: true, preferredResolution });
  } catch (e) {
    console.error('Resolution settings error:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
