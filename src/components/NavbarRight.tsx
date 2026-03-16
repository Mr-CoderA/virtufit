'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
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
    <div className="flex items-center gap-1.5 md:gap-2">
      <NavBalanceNotifications initialCredits={initialCredits} />
      <Link
        href="/settings"
        className="flex h-7 w-7 md:h-auto md:w-auto md:min-w-0 items-center justify-center rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent text-[#F0EFE8] transition-[background] duration-200 hover:bg-[rgba(240,239,232,0.05)] md:rounded-full md:border md:border-[rgba(240,239,232,0.14)] md:px-4 md:py-1.5 md:text-[13px]"
        title="Settings"
      >
        <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        title="Log out"
        className="flex h-7 w-7 shrink-0 items-center justify-center gap-1 rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent text-[#F0EFE8] transition-[background] duration-200 hover:bg-[rgba(240,239,232,0.05)] md:h-auto md:w-auto md:rounded-full md:border md:px-4 md:py-1.5 md:text-[13px]"
      >
        <LogOut className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
        <span className="hidden md:inline">Log out</span>
      </button>
    </div>
  );
}
