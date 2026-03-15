import { NextResponse } from 'next/server';
import { getSessionAndValidate, ACCOUNT_DELETED_RESPONSE } from '@/lib/auth';
import { prisma } from '@/lib/db';

const INITIAL_CREDITS = 10;

export async function GET() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) return NextResponse.json(ACCOUNT_DELETED_RESPONSE, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: validation.session.userId },
    select: {
      onboardingCompleted: true,
      credits: true,
      integratedDomains: true,
      apiKeys: { take: 1, select: { id: true } },
      usageLogs: { take: 1, select: { id: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.onboardingCompleted) {
    return NextResponse.json({
      completed: true,
      steps: [
        { id: 'api_key', label: 'Copy your API key', done: true },
        { id: 'first_call', label: 'Make your first API call', done: true },
        { id: 'integrate', label: 'Integrate into your store', done: true },
        { id: 'topup', label: 'Top up credits', done: true },
      ],
    });
  }

  const hasApiKey = user.apiKeys.length > 0;
  const hasFirstCall = user.usageLogs.length > 0;
  const hasIntegrate = Array.isArray(user.integratedDomains) && user.integratedDomains.length > 0;
  const hasTopUp = user.credits > INITIAL_CREDITS;

  const steps = [
    { id: 'api_key', label: 'Copy your API key', done: hasApiKey },
    { id: 'first_call', label: 'Make your first API call', done: hasFirstCall },
    { id: 'integrate', label: 'Integrate into your store', done: hasIntegrate },
    { id: 'topup', label: 'Top up credits', done: hasTopUp },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone) {
    await prisma.user.update({
      where: { id: validation.session.userId },
      data: { onboardingCompleted: true },
    });
  }

  return NextResponse.json({
    completed: allDone,
    steps,
  });
}
