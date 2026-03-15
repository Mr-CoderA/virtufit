'use client';

import { useRouter } from 'next/navigation';
import { NavBalanceNotifications } from '@/components/NavBalanceNotifications';
import { useToast } from '@/components/ui/ToastProvider';

export function NavbarRight({
  initialCredits,
}: {
  initialCredits: number;
}) {
  const router = useRouter();
  const toast = useToast();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.info('You have been signed out.', { duration: 3000 });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <NavBalanceNotifications initialCredits={initialCredits} />
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-4 py-1.5 text-[13px] text-[#F0EFE8] transition-[background] duration-200 ease-out hover:bg-[rgba(240,239,232,0.05)]"
      >
        Log out
      </button>
    </div>
  );
}
