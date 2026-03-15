import { redirect } from 'next/navigation';
import { getSessionAndValidate } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TryOnDemo } from './TryOnDemo';

export default async function DemoPage() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) redirect('/login?closed=1');
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: validation.session.userId },
    select: { credits: true, preferredResolution: true },
  });

  if (!user) {
    redirect('/login');
  }

  const resolution = user.preferredResolution ?? '1K';

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#1A1915]">
      <main className="relative z-10 mx-auto max-w-2xl px-8 py-16">
        <div className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2.5">Demo</p>
          <h1
            className="text-[28px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Try virtual try-on
          </h1>
          <p className="mt-2 text-[15px] leading-[1.75] text-[#A09E97] mb-8">
            Use the API with your own images. Each run uses credits from your account.
          </p>
        </div>
        <TryOnDemo credits={user.credits} preferredResolution={resolution} />
      </main>
    </div>
  );
}
