'use client';

import Link from 'next/link';
import { NavbarRight } from '@/components/NavbarRight';
import { VirtuFitLogo } from '@/components/VirtuFitLogo';

const navLinkClass =
  'text-[13px] font-normal text-[#A09E97] no-underline transition-colors duration-200 ease-out hover:text-[#F0EFE8]';
const pillPrimary =
  'inline-flex items-center justify-center rounded-full bg-[#F0EFE8] px-6 py-2.5 text-[13px] font-medium text-[#1A1915] transition-opacity duration-200 hover:opacity-[0.88]';

export function AppNav({
  session,
  initialCredits,
}: {
  session: { userId: string } | null;
  initialCredits: number;
}) {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[rgba(240,239,232,0.08)] bg-[#1A1915]"
      style={{ borderBottomWidth: '0.5px', height: '56px' }}
    >
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between gap-1.5 px-3 md:gap-4 md:px-10">
        <VirtuFitLogo showTagline={false} size="nav" />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {session ? (
            <>
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <Link href="/dashboard/integrate" className={navLinkClass}>
                Integrate
              </Link>
              <Link href="/docs" className={navLinkClass}>
                Documentation
              </Link>
              <Link href="/settings" className={navLinkClass}>
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
              <Link href="/docs" className={navLinkClass}>
                Documentation
              </Link>
              <Link href="/contact" className={navLinkClass}>
                Contact
              </Link>
              <Link href="/login" className={navLinkClass}>
                Sign in
              </Link>
              <Link href="/signup" className={navLinkClass}>
                Sign up
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center justify-end shrink-0 min-w-0">
          {session ? (
            <NavbarRight initialCredits={initialCredits} />
          ) : (
            <Link href="/signup" className={pillPrimary}>
              Get started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
