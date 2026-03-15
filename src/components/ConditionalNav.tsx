'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from '@/components/AppNav';
import { SiteFooter } from '@/components/SiteFooter';

const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/verify-email', '/confirm-deletion'];

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
  // On login/signup etc. always show logged-out nav so the bar is never misleading
  const showLoggedOutNav = PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const navSession = showLoggedOutNav ? null : session;
  return (
    <>
      <AppNav session={navSession} initialCredits={navSession ? initialCredits : 0} />
      {children}
      <SiteFooter />
    </>
  );
}
