'use client';

export function DashboardCreditsCard({ credits }: { credits: number }) {
  function openTopUp() {
    window.dispatchEvent(new CustomEvent('open-topup'));
  }

  return (
    <div
      className="w-full box-border rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] py-[22px] px-6 transition-[background,border-color] duration-200 ease-out hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]"
      style={{ borderWidth: '0.5px' }}
    >
      <span className="text-[11px] text-[var(--vf-quiet)]">01</span>
      <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[var(--vf-quiet)]">
        API CREDITS
      </p>
      <p
        className="mt-4 text-[36px] font-normal leading-none text-[var(--vf-ink)] md:text-[48px]"
        style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
      >
        {credits.toLocaleString()}
      </p>
      <p className="mt-2 text-[13px] text-[var(--vf-muted)]">credits available</p>
      <button
        type="button"
        onClick={openTopUp}
        className="mt-5 rounded-full bg-[var(--vf-ink)] px-5 py-2 text-[13px] font-medium text-[var(--vf-page)] transition-opacity duration-200 hover:opacity-[0.88]"
      >
        Top up
      </button>
    </div>
  );
}
