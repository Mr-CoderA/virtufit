'use client';

import { LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { VirtuFitLogo } from '@/components/VirtuFitLogo';

export function HomeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="relative z-10 text-center max-w-lg px-2">
      <div className="flex flex-col items-center gap-8 mb-10">
        <VirtuFitLogo showTagline size="lg" />
        <p className="text-[15px] leading-[1.75] text-[#A09E97] max-w-md">
          Virtual try-on API — integrate try-on into your app with credits.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {isLoggedIn ? (
          <ButtonLink
            href="/dashboard"
            variant="primary"
            size="lg"
            className="min-w-[200px]"
            leftIcon={<LayoutDashboard className="h-5 w-5" />}
          >
            Go to Dashboard
          </ButtonLink>
        ) : (
          <>
            <ButtonLink
              href="/login"
              variant="primary"
              size="lg"
              className="min-w-[160px]"
              leftIcon={<LogIn className="h-5 w-5" />}
            >
              Sign in
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="secondary"
              size="lg"
              className="min-w-[160px]"
              leftIcon={<UserPlus className="h-5 w-5" />}
            >
              Sign up
            </ButtonLink>
          </>
        )}
      </div>
    </div>
  );
}
