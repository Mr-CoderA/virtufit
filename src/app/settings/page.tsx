import { redirect } from 'next/navigation';
import { getSessionAndValidate } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { SettingsForms } from './SettingsForms';

export default async function SettingsPage() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) redirect('/login?closed=1');
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: validation.session.userId },
    select: { id: true, email: true, name: true, preferredResolution: true },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#1A1915]">
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-[64px] sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="eyebrow mb-2">Account</p>
          <h1
            className="text-[28px] font-normal tracking-[-0.025em] text-[#F0EFE8]"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Settings
          </h1>
          <p className="mt-2 text-[15px] leading-[1.75] text-[#A09E97]">
            Manage your account and preferences.
          </p>
        </div>

        <GlassCard className="p-7 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-12">
            <Avatar name={user.name} email={user.email} size="lg" />
            <div>
              <h2
                className="text-[22px] font-normal tracking-[-0.025em] text-[#F0EFE8]"
                style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
              >
                {user.name || user.email}
              </h2>
              <p className="text-[15px] text-[#A09E97] mt-1">{user.email}</p>
            </div>
          </div>

          <SettingsForms initialResolution={user.preferredResolution ?? '1K'} />
        </GlassCard>
      </main>
    </div>
  );
}
