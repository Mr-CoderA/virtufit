'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/ToastProvider';

type User = { id: string; email: string; name: string | null };

export function DashboardClient({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.info('You have been signed out.', { duration: 3000 });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings"
        className="hidden sm:flex items-center gap-2 rounded-full px-2 py-1.5 transition-opacity duration-200 hover:bg-[rgba(240,239,232,0.05)]"
        title="Settings"
      >
        <Avatar name={user.name} email={user.email} size="sm" />
        <span className="text-[13px] text-[#A09E97] truncate max-w-[140px]">{user.email}</span>
      </Link>
      <Button variant="secondary" size="sm" onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
        Log out
      </Button>
    </div>
  );
}
