'use client';

import Link from 'next/link';

export function VirtuFitLogo({ showTagline = false, size = 'md' }: { showTagline?: boolean; size?: 'sm' | 'md' | 'lg' | 'nav' }) {
  const scale = size === 'sm' ? 32 : size === 'lg' ? 48 : size === 'nav' ? 36 : 40;
  const textSize =
    size === 'lg' ? 'text-[20px] sm:text-[24px]' :
    size === 'sm' ? 'text-[13px]' :
    size === 'nav' ? 'text-[18px]' :
    'text-[15px] sm:text-[16px]';
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 shrink-0 transition-opacity duration-200 hover:opacity-90"
      aria-label="VirtuFit — Virtual try-on API"
    >
      <svg width={scale} height={scale} viewBox="0 0 100 100" className="shrink-0" aria-hidden>
        <rect width="100" height="100" rx="24" fill="#222219" />
        <rect width="100" height="100" rx="24" fill="none" stroke="rgba(240,239,232,0.1)" strokeWidth="0.5" />
        <circle cx="50" cy="26" r="10" fill="none" stroke="#F0EFE8" strokeWidth="2" />
        <path
          d="M30,42 L20,47 L22,62 L34,58 L32,78 L68,78 L66,58 L78,62 L80,47 L70,42 L50,54 Z"
          fill="none"
          stroke="#F0EFE8"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M38,42 L50,54 L62,42" fill="none" stroke="#F0EFE8" strokeWidth="2" strokeLinejoin="round" />
        <path d="M78,18 L80,23 L85,25 L80,27 L78,32 L76,27 L71,25 L76,23 Z" fill="#D9714A" />
      </svg>
      <div className="wm-main flex flex-col items-start">
        <div
          className={`wm-name font-normal tracking-tight text-[#F0EFE8] ${textSize}`}
          style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
        >
          Virtu<span className="wm-accent text-[#D9714A]">Fit</span>
        </div>
        {showTagline && (
          <div className="wm-tag text-[11px] text-[#65635D] uppercase tracking-wider mt-1">
            Virtual try-on API
          </div>
        )}
      </div>
    </Link>
  );
}

export function VirtuFitLogoSvgOnly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect width="100" height="100" rx="24" fill="#222219" />
      <rect width="100" height="100" rx="24" fill="none" stroke="rgba(240,239,232,0.1)" strokeWidth="0.5" />
      <circle cx="50" cy="26" r="10" fill="none" stroke="#F0EFE8" strokeWidth="2" />
      <path
        d="M30,42 L20,47 L22,62 L34,58 L32,78 L68,78 L66,58 L78,62 L80,47 L70,42 L50,54 Z"
        fill="none"
        stroke="#F0EFE8"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M38,42 L50,54 L62,42" fill="none" stroke="#F0EFE8" strokeWidth="2" strokeLinejoin="round" />
      <path d="M78,18 L80,23 L85,25 L80,27 L78,32 L76,27 L71,25 L76,23 Z" fill="#D9714A" />
    </svg>
  );
}
