'use client';

export default function AdminAppearancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[var(--vf-ink)] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Appearance</h2>
      <p className="text-[13px] text-[var(--vf-muted)] mb-5">Theme and branding settings.</p>
      <div className="rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-6 transition-colors hover:border-[rgba(21,43,67,0.14)]" style={{ borderWidth: '0.5px' }}>
        <p className="text-[13px] text-[var(--vf-muted)]">Configure here when available.</p>
      </div>
    </div>
  );
}
