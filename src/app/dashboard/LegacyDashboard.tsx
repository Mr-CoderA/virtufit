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

export default async function LegacyDashboard() {
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
    <div className="min-h-screen w-full bg-[var(--vf-page)] overflow-x-hidden box-border">
      <Suspense fallback={null}>
        <DashboardToasts />
      </Suspense>
      <DashboardActions />

      <main className="mx-auto w-full max-w-4xl box-border px-4 py-5 md:px-6 md:py-10">
        {/* Hero */}
        <section className="mb-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)]">
            DASHBOARD
          </p>
          <h1
            className="mb-2 text-[26px] font-normal tracking-[-0.025em] text-[var(--vf-ink)] md:text-[32px] overflow-hidden text-ellipsis"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Welcome back, {firstName}
          </h1>
          <p className="mb-8 text-[14px] leading-[1.75] text-[var(--vf-muted)]">
            Manage your API access and usage.
          </p>
        </section>

        <OnboardingCard />

        {/* Three cards */}
        <section className="grid w-full grid-cols-1 gap-3 pb-10 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div className="w-full box-border">
            <DashboardCreditsCard credits={user.credits} />
          </div>
          <a
            href="/dashboard/demo"
            className="block w-full box-border rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] py-[22px] px-6 transition-[background,border-color] duration-200 hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]"
            style={{ borderWidth: '0.5px' }}
          >
            <span className="text-[11px] text-[var(--vf-quiet)]">02</span>
            <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[var(--vf-quiet)]">
              TRY IT NOW
            </p>
            <h3 className="mt-4 text-[22px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>
              Try the demo
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-[var(--vf-muted)]">
              Upload your photo and a garment to see a live try-on
            </p>
            <span className="mt-5 inline-block rounded-full border border-[rgba(21,43,67,0.14)] bg-transparent px-5 py-2 text-[13px] text-[var(--vf-ink)] transition-colors duration-200 hover:bg-[rgba(21,43,67,0.14)]">
              Open demo →
            </span>
          </a>
          <div
            className="w-full box-border rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] py-[22px] px-6 transition-[background,border-color] duration-200 hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]"
            style={{ borderWidth: '0.5px' }}
          >
            <span className="text-[11px] text-[var(--vf-quiet)]">03</span>
            <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[var(--vf-quiet)]">
              DOCUMENTATION
            </p>
            <h3 className="mt-4 text-[22px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>
              API reference & guides
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-[var(--vf-muted)]">
              Integration guides for Shopify, WordPress, and custom websites
            </p>
            <a
              href="/docs"
              className="mt-5 block text-[13px] text-[var(--vf-accent)] no-underline transition-opacity duration-200 hover:opacity-80"
            >
              View docs →
            </a>
          </div>
        </section>

        {/* API usage */}
        <section className="pb-16">
          <h2 className="mb-1 text-[22px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>
            API usage
          </h2>
          <p className="mb-6 text-[14px] text-[var(--vf-muted)]">API calls over the last 7 days.</p>
          <div
            className="min-h-[200px] rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-7"
            style={{ borderWidth: '0.5px' }}
          >
            <DashboardUsageChart />
          </div>
        </section>

        {/* Credit usage */}
        <section className="pb-16">
          <h2 className="mb-1 text-[22px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>
            Credit usage
          </h2>
          <p className="mb-6 text-[14px] text-[var(--vf-muted)]">Credits consumed over the last 7 days.</p>
          <div
            className="min-h-[200px] rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-7"
            style={{ borderWidth: '0.5px' }}
          >
            <DashboardCreditsChart />
          </div>
        </section>

        {/* Top-up history */}
        <section className="pb-16">
          <h2 className="mb-1 text-[22px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>
            Top-up history
          </h2>
          <p className="mb-6 text-[14px] text-[var(--vf-muted)]">Successful credit purchases.</p>
          <div
            className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-7"
            style={{ borderWidth: '0.5px' }}
          >
            <DashboardTopUpHistory />
          </div>
        </section>

        {/* API access */}
        <section className="pb-16">
          <GlassCard className="w-full box-border overflow-hidden p-4 md:p-7" style={{ borderWidth: '0.5px' }}>
            <DashboardApiAccess baseUrl={baseUrl} />
          </GlassCard>
        </section>

        {/* Getting started */}
        <section className="pb-16">
          <GlassCard className="w-full box-border p-6 md:p-7" style={{ borderWidth: '0.5px' }}>
            <h2 className="mb-6 text-[22px] font-normal text-[var(--vf-ink)]" style={{ fontFamily: 'Georgia, serif' }}>
              Getting started
            </h2>
            <ol className="space-y-0">
              <li className="flex items-center justify-between gap-3 border-b border-[rgba(21,43,67,0.14)] py-3 first:pt-0" style={{ borderBottomWidth: '0.5px' }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface-hover)] text-[13px] font-medium text-[var(--vf-muted)]" style={{ borderWidth: '0.5px' }}>1</span>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--vf-muted)]">Get your API key</p>
                    <p className="mt-0.5 text-[13px] text-[var(--vf-muted)]">Create an API key in API keys to authenticate requests.</p>
                  </div>
                </div>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-[rgba(21,43,67,0.14)] py-3" style={{ borderBottomWidth: '0.5px' }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface-hover)] text-[13px] font-medium text-[var(--vf-muted)]" style={{ borderWidth: '0.5px' }}>2</span>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--vf-muted)]">Read the API docs</p>
                    <p className="mt-0.5 text-[13px] text-[var(--vf-muted)]">Check the reference for endpoints, request format, and examples.</p>
                  </div>
                </div>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-[rgba(21,43,67,0.14)] py-3" style={{ borderBottomWidth: '0.5px' }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface-hover)] text-[13px] font-medium text-[var(--vf-muted)]" style={{ borderWidth: '0.5px' }}>3</span>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--vf-muted)]">Make your first request</p>
                    <p className="mt-0.5 text-[13px] text-[var(--vf-muted)]">Use your key and base URL to call the virtual try-on API.</p>
                  </div>
                </div>
              </li>
              <li className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface-hover)] text-[13px] font-medium text-[var(--vf-muted)]" style={{ borderWidth: '0.5px' }}>4</span>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--vf-muted)]">Top up when needed</p>
                    <p className="mt-0.5 text-[13px] text-[var(--vf-muted)]">Add credits to keep your integration running.</p>
                  </div>
                </div>
              </li>
            </ol>
          </GlassCard>
        </section>

        {/* Footer links */}
        <div className="flex flex-wrap items-center gap-4 pb-16">
          <ButtonLink href="/" variant="ghost" size="sm" leftIcon={<Home className="h-4 w-4" />}>
            Back to home
          </ButtonLink>
          <ButtonLink href="/dashboard/demo" variant="ghost" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
            Demo
          </ButtonLink>
          <ButtonLink href="/dashboard/api-keys" variant="ghost" size="sm" leftIcon={<Key className="h-4 w-4" />}>
            API keys
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
