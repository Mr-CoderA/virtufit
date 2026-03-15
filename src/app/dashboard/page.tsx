import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSessionAndValidate } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBaseApiUrl } from '@/lib/base-api-url';
import { DashboardActions } from './DashboardActions';
import { DashboardToasts } from './DashboardToasts';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardApiAccess } from './DashboardApiAccess';
import { DashboardCreditsCard } from './DashboardCreditsCard';
import { DashboardUsageChart } from './DashboardUsageChart';
import { DashboardCreditsChart } from './DashboardCreditsChart';
import { DashboardTopUpHistory } from './DashboardTopUpHistory';
import { OnboardingCard } from './OnboardingCard';
import { ButtonLink } from '@/components/ui/Button';
import { Home, Key, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) redirect('/login?closed=1');
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: validation.session.userId },
    select: { id: true, email: true, name: true, credits: true },
  });

  if (!user) {
    redirect('/login');
  }

  const baseUrl = await getBaseApiUrl();
  const firstName = user.name || user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-[#1A1915]">
      <Suspense fallback={null}>
        <DashboardToasts />
      </Suspense>
      <DashboardActions />

      <main className="mx-auto max-w-[1100px]">
        {/* Hero */}
        <section className="px-5 pt-12 pb-8 md:px-10 md:pt-[48px] md:pb-8" style={{ maxWidth: '800px' }}>
          <p
            className="mb-3 text-[11px] font-normal uppercase tracking-[0.1em] text-[#D9714A]"
            style={{ letterSpacing: '0.1em' }}
          >
            DASHBOARD
          </p>
          <h1
            className="text-[28px] font-normal tracking-[-0.025em] text-[#F0EFE8] md:text-[36px] whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.75] text-[#A09E97]">
            Manage your API access and usage.
          </p>
        </section>

        <OnboardingCard />

        {/* Three cards */}
        <section className="grid grid-cols-1 gap-4 px-5 pb-10 md:grid-cols-3 md:gap-4 md:px-10 md:pb-10">
          <DashboardCreditsCard credits={user.credits} />
          <a
            href="/dashboard/demo"
            className="block rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] py-6 px-7 transition-[background,border-color] duration-200 ease-out hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]"
            style={{ borderWidth: '0.5px' }}
          >
            <span className="text-[11px] text-[#65635D]">02</span>
            <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[#65635D]">
              TRY IT NOW
            </p>
            <h3
              className="mt-4 text-[22px] font-normal text-[#F0EFE8]"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              Try the demo
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#A09E97]">
              Upload your photo and a garment to see a live try-on
            </p>
            <span className="mt-5 inline-block rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-5 py-2 text-[13px] text-[#F0EFE8] transition-colors duration-200 hover:bg-[rgba(240,239,232,0.05)]">
              Open demo →
            </span>
          </a>
          <div
            className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] py-6 px-7 transition-[background,border-color] duration-200 ease-out hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]"
            style={{ borderWidth: '0.5px' }}
          >
            <span className="text-[11px] text-[#65635D]">03</span>
            <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[#65635D]">
              DOCUMENTATION
            </p>
            <h3
              className="mt-4 text-[22px] font-normal text-[#F0EFE8]"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              API reference & guides
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#A09E97]">
              Integration guides for Shopify, WordPress, and custom websites
            </p>
            <a
              href="/docs"
              className="mt-5 block text-[13px] text-[#D9714A] no-underline transition-opacity duration-200 hover:opacity-80"
            >
              View docs →
            </a>
          </div>
        </section>

        {/* API usage */}
        <section className="px-5 pb-16 md:px-10 md:pb-16">
          <h2
            className="mb-1 text-[22px] font-normal text-[#F0EFE8]"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            API usage
          </h2>
          <p className="mb-6 text-[14px] text-[#A09E97]">
            API calls over the last 7 days.
          </p>
          <div
            className="min-h-[200px] rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-7"
            style={{ borderWidth: '0.5px' }}
          >
            <DashboardUsageChart />
          </div>
        </section>

        {/* Credit usage */}
        <section className="px-5 pb-16 md:px-10 md:pb-16">
          <h2
            className="mb-1 text-[22px] font-normal text-[#F0EFE8]"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Credit usage
          </h2>
          <p className="mb-6 text-[14px] text-[#A09E97]">
            Credits consumed over the last 7 days.
          </p>
          <div
            className="min-h-[200px] rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-7"
            style={{ borderWidth: '0.5px' }}
          >
            <DashboardCreditsChart />
          </div>
        </section>

        {/* Top-up history */}
        <section className="px-5 pb-16 md:px-10 md:pb-16">
          <h2
            className="mb-1 text-[22px] font-normal text-[#F0EFE8]"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Top-up history
          </h2>
          <p className="mb-6 text-[14px] text-[#A09E97]">
            Successful credit purchases.
          </p>
          <div
            className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-7"
            style={{ borderWidth: '0.5px' }}
          >
            <DashboardTopUpHistory />
          </div>
        </section>

        {/* API access */}
        <section className="px-5 pb-16 md:px-10 md:pb-16">
          <GlassCard className="p-6 md:p-7" style={{ borderWidth: '0.5px' }}>
            <DashboardApiAccess baseUrl={baseUrl} />
          </GlassCard>
        </section>

        {/* Getting started */}
        <section className="px-5 pb-16 md:px-10 md:pb-16">
          <GlassCard className="p-6 md:p-7" style={{ borderWidth: '0.5px' }}>
            <h2
              className="mb-6 text-[22px] font-normal text-[#F0EFE8]"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              Getting started
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] text-[13px] font-medium text-[#A09E97]">
                  1
                </span>
                <div>
                  <p className="text-[15px] font-medium text-[#F0EFE8]">Get your API key</p>
                  <p className="mt-0.5 text-[13px] text-[#A09E97]">
                    Create an API key in API keys to authenticate requests.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] text-[13px] font-medium text-[#A09E97]">
                  2
                </span>
                <div>
                  <p className="text-[15px] font-medium text-[#F0EFE8]">Read the API docs</p>
                  <p className="mt-0.5 text-[13px] text-[#A09E97]">
                    Check the reference for endpoints, request format, and examples.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] text-[13px] font-medium text-[#A09E97]">
                  3
                </span>
                <div>
                  <p className="text-[15px] font-medium text-[#F0EFE8]">Make your first request</p>
                  <p className="mt-0.5 text-[13px] text-[#A09E97]">
                    Use your key and base URL to call the virtual try-on API.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] text-[13px] font-medium text-[#A09E97]">
                  4
                </span>
                <div>
                  <p className="text-[15px] font-medium text-[#F0EFE8]">Top up when needed</p>
                  <p className="mt-0.5 text-[13px] text-[#A09E97]">
                    Add credits to keep your integration running.
                  </p>
                </div>
              </li>
            </ol>
          </GlassCard>
        </section>

        {/* Footer links */}
        <div className="flex flex-wrap items-center gap-4 px-5 pb-16 md:px-10 md:pb-16">
          <ButtonLink href="/" variant="ghost" size="sm" leftIcon={<Home className="h-4 w-4" />}>
            Back to home
          </ButtonLink>
          <ButtonLink href="/dashboard/demo" variant="ghost" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
            Demo
          </ButtonLink>
          <ButtonLink
            href="/dashboard/api-keys"
            variant="ghost"
            size="sm"
            leftIcon={<Key className="h-4 w-4" />}
          >
            API keys
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
