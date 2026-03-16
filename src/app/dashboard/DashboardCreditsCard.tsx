'use client';

export function DashboardCreditsCard({ credits }: { credits: number }) {
  function openTopUp() {
    window.dispatchEvent(new CustomEvent('open-topup'));
  }

  return (
    <div
      className="w-full box-border rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] py-[22px] px-6 transition-[background,border-color] duration-200 ease-out hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]"
      style={{ borderWidth: '0.5px' }}
    >
      <span className="text-[11px] text-[#65635D]">01</span>
      <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.1em] text-[#65635D]">
        API CREDITS
      </p>
      <p
        className="mt-4 text-[36px] font-normal leading-none text-[#F0EFE8] md:text-[48px]"
        style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
      >
        {credits.toLocaleString()}
      </p>
      <p className="mt-2 text-[13px] text-[#A09E97]">credits available</p>
      <button
        type="button"
        onClick={openTopUp}
        className="mt-5 rounded-full bg-[#F0EFE8] px-5 py-2 text-[13px] font-medium text-[#1A1915] transition-opacity duration-200 hover:opacity-[0.88]"
      >
        Top up
      </button>
    </div>
  );
}
