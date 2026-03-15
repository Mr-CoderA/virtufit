import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

const PREFIX = 'vf_';
const KEY_BYTES = 24; // 32 chars hex

function generateSecret(): string {
  return crypto.randomBytes(KEY_BYTES).toString('hex');
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function GET() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: validation.session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({ apiKeys: keys });
}

export async function POST(request: Request) {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: 'Name is required (max 100 characters)' },
        { status: 400 }
      );
    }

    const secret = generateSecret();
    const fullKey = `${PREFIX}${secret}`;
    const keyHash = hashKey(fullKey);
    const keyPrefix = `${PREFIX}${secret.slice(0, 4)}...${secret.slice(-4)}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: validation.session.userId,
        name,
        keyPrefix,
        keyHash,
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey,
      keyPrefix: apiKey.keyPrefix,
      createdAt: apiKey.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('Create API key error:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
