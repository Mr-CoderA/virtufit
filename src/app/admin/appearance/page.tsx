'use client';

export default function AdminAppearancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Appearance</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">Theme and branding settings.</p>
      <div className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6 transition-colors hover:border-[rgba(240,239,232,0.14)]" style={{ borderWidth: '0.5px' }}>
        <p className="text-[13px] text-[#A09E97]">Configure here when available.</p>
      </div>
    </div>
  );
}
