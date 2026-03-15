'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from '@/components/AppNav';

export function ConditionalNav({
  session,
  initialCredits,
  children,
}: {
  session: { userId: string } | null;
  initialCredits: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname.startsWith('/admin');
  if (isAdmin) {
    return <>{children}</>;
  }
  return (
    <>
      <AppNav session={session} initialCredits={initialCredits} />
      {children}
    </>
  );
}
