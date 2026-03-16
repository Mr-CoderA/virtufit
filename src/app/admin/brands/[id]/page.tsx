'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T; error?: string; status: number }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`/api/admin${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  }).then(async (r) => {
    const data = await r.json();
    return { data: data as T, error: (data as { error?: string }).error, status: r.status };
  });
}

export default function AdminBrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [brand, setBrand] = useState<{
    brand: {
      id: string; name: string | null; email: string; credits: number; createdAt: string; suspended: boolean; apiKeyPrefix: string | null;
      isDeleted?: boolean; deletedAt?: string | null; deletedBy?: string | null; deletedReason?: string | null;
      emailVerified?: boolean; emailVerifiedAt?: string | null;
      wasReactivated?: boolean; reactivatedAt?: string | null; previousDeletionReason?: string | null;
    };
    creditHistory: Array<{ createdAt: string; type: string; amount: number; note: string | null }>;
    generations: Array<{ id: string; tier: string; jobId: string | null; outputUrl: string | null; creditsUsed: number; createdAt: string }>;
    revenue: Array<{ createdAt: string; credits: number; amountCents: number; orderId: string | null }>;
    totalSpentLifetime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [resendVerifyLoading, setResendVerifyLoading] = useState(false);
  const [resendVerifySent, setResendVerifySent] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminFetch<typeof brand>(`/brands/${id}`).then((r) => {
      if (r.data) setBrand(r.data);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    const reason = deleteReason.trim();
    if (reason.length < 10) {
      setDeleteError('Reason is required (min 10 characters).');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const r = await fetch(`/api/admin/brands/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ reason }),
    });
    const data = await r.json();
    setDeleting(false);
    if (r.ok) {
      setDeleteOpen(false);
      setDeleteReason('');
      if (brand) adminFetch<typeof brand>(`/brands/${id}`).then((r) => { if (r.data) setBrand(r.data); });
      router.refresh();
    } else {
      setDeleteError(data.error || 'Failed to delete');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const r = await fetch(`/api/admin/brands/${id}/restore`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    setRestoring(false);
    if (r.ok && brand) {
      adminFetch<typeof brand>(`/brands/${id}`).then((res) => { if (res.data) setBrand(res.data); });
      router.refresh();
    }
  };

  const handleResendVerification = async () => {
    setResendVerifyLoading(true);
    setResendVerifySent(false);
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const r = await fetch(`/api/admin/brands/${id}/resend-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    setResendVerifyLoading(false);
    if (r.ok) setResendVerifySent(true);
  };

  if (loading || !brand) return <p className="text-[#A09E97]">Loading…</p>;

  const b = brand.brand;
  return (
    <div className="space-y-6">
      <Link href="/admin/brands" className="text-[#D9714A] hover:underline text-[13px]">← Back to brands</Link>

      {b.wasReactivated && b.reactivatedAt && (
        <div className="rounded-xl border border-[rgba(217,113,74,0.35)] bg-[rgba(217,113,74,0.08)] p-4">
          <p className="text-[#F0EFE8] text-[14px]">
            This account was reactivated on {new Date(b.reactivatedAt).toLocaleString()} after being deleted on {b.deletedAt ? new Date(b.deletedAt).toLocaleString() : '—'}.
            {b.previousDeletionReason ? ` Deletion reason: ${b.previousDeletionReason}` : ''}
          </p>
        </div>
      )}

      {b.isDeleted && (
        <div className="rounded-xl border border-[rgba(226,75,74,0.4)] bg-[rgba(226,75,74,0.08)] p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[#F0EFE8] font-medium">This account was deleted on {b.deletedAt ? new Date(b.deletedAt).toLocaleString() : '—'} by {b.deletedBy ?? '—'}</p>
            <p className="text-[#A09E97] text-[13px] mt-1">Reason: {b.deletedReason ?? '—'}</p>
          </div>
          <button
            type="button"
            onClick={handleRestore}
            disabled={restoring}
            className="rounded-full bg-[#F0EFE8] text-[#1A1915] px-5 py-2 text-[13px] font-medium border-0 hover:opacity-90 disabled:opacity-50"
          >
            {restoring ? 'Restoring…' : 'Restore account'}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h2 className="text-[16px] font-medium text-[#F0EFE8] mb-4">Brand profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1915] border border-[rgba(240,239,232,0.12)] flex items-center justify-center text-[#D9714A] font-medium">
            {(b.name || b.email).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[#F0EFE8] font-medium">{b.name || b.email}</p>
            <p className="text-[#A09E97] text-[13px]">{b.email}</p>
            <p className="text-[#65635D] text-[12px]">Joined {new Date(b.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <p className="text-[13px] text-[#A09E97]">Plan: FREE · Status: {b.suspended ? 'Suspended' : 'Active'}</p>
          <span className="text-[13px] text-[#A09E97]">
            Email: {b.email} · Status: {b.emailVerified ? <span className="text-[#D9714A]">✓ Verified</span> : <span className="text-[#A09E97]">✗ Not verified</span>}
            {b.emailVerifiedAt ? ` · Verified at: ${new Date(b.emailVerifiedAt).toLocaleString()}` : ' · Verified at: Never'}
          </span>
          {!b.emailVerified && !b.isDeleted && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendVerifyLoading}
              className="rounded-lg border border-[rgba(240,239,232,0.2)] bg-transparent text-[#F0EFE8] px-3 py-1.5 text-[12px] hover:bg-[rgba(240,239,232,0.06)] disabled:opacity-50"
            >
              {resendVerifyLoading ? 'Sending…' : resendVerifySent ? 'Verification email sent' : 'Resend verification email'}
            </button>
          )}
        </div>
        <p className="text-[13px] text-[#A09E97] mt-2">API key: {b.apiKeyPrefix ?? '—'} <button type="button" className="text-[#D9714A] hover:underline ml-2">Copy</button></p>
        {!b.isDeleted && (
          <div className="mt-6 pt-4 border-t border-[rgba(240,239,232,0.08)]">
            <button
              type="button"
              onClick={() => { setDeleteOpen(true); setDeleteReason(''); setDeleteError(''); }}
              className="rounded-full border border-[rgba(226,75,74,0.3)] bg-transparent px-5 py-2 text-[13px] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.08)]"
            >
              Delete account
            </button>
          </div>
        )}
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !deleting && setDeleteOpen(false)}>
          <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-medium text-[#F0EFE8] mb-2">Delete this account</h3>
            <p className="text-[13px] text-[#A09E97] mb-4">
              This will immediately block login and disable their API key. All data is preserved and the account can be restored at any time.
            </p>
            <label className="block text-[13px] text-[#A09E97] mb-2">Reason (required, min 10 characters)</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. User requested account closure"
              rows={3}
              className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8] placeholder:text-[#65635D] mb-3 resize-none"
            />
            {deleteError && <p className="text-[13px] text-[#e0a0a0] mb-3">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => !deleting && setDeleteOpen(false)} className="rounded-lg px-4 py-2 text-[13px] text-[#A09E97] hover:bg-[rgba(240,239,232,0.06)]" disabled={deleting}>Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting || deleteReason.trim().length < 10} className="rounded-full border border-[rgba(226,75,74,0.3)] bg-transparent px-5 py-2 text-[13px] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.08)] disabled:opacity-50 disabled:cursor-not-allowed">
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h2 className="text-[16px] font-medium text-[#F0EFE8] mb-4">Credits</h2>
        <p className="text-[28px] font-normal text-[#F0EFE8] mb-4" style={{ fontFamily: 'Georgia, serif' }}>{b.credits}</p>
        <p className="text-[13px] text-[#A09E97]">Add / Deduct / Reset from admin actions.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[#65635D]"><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Note</th></tr></thead>
            <tbody>
              {brand.creditHistory.slice(0, 20).map((h) => (
                <tr key={h.createdAt + h.amount} className="border-t border-[rgba(240,239,232,0.06)]">
                  <td className="p-2 text-[#A09E97]">{new Date(h.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-[#A09E97]">{h.type}</td>
                  <td className={`p-2 ${h.amount >= 0 ? 'text-[#D9714A]' : 'text-[#E24B4A]'}`}>{h.amount >= 0 ? '+' : ''}{h.amount}</td>
                  <td className="p-2 text-[#A09E97]">{h.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h2 className="text-[16px] font-medium text-[#F0EFE8] mb-4">Generation history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[#65635D]"><th className="p-2">Date</th><th className="p-2">Tier</th><th className="p-2">Credits</th><th className="p-2">Output</th></tr></thead>
            <tbody>
              {brand.generations.slice(0, 20).map((g) => (
                <tr key={g.id} className="border-t border-[rgba(240,239,232,0.06)]">
                  <td className="p-2 text-[#A09E97]">{new Date(g.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-[#A09E97]">{g.tier}</td>
                  <td className="p-2 text-[#F0EFE8]">{g.creditsUsed}</td>
                  <td className="p-2">{g.outputUrl ? <img src={g.outputUrl} alt="" className="w-12 h-12 object-cover rounded" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h2 className="text-[16px] font-medium text-[#F0EFE8] mb-4">Revenue history</h2>
        <p className="text-[13px] text-[#A09E97] mb-2">Total spent (lifetime): ${brand.totalSpentLifetime.toFixed(2)}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[#65635D]"><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Credits</th><th className="p-2">Order ID</th></tr></thead>
            <tbody>
              {brand.revenue.map((r) => (
                <tr key={r.createdAt + (r.orderId ?? '')} className="border-t border-[rgba(240,239,232,0.06)]">
                  <td className="p-2 text-[#A09E97]">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-[#F0EFE8]">${(r.amountCents / 100).toFixed(2)}</td>
                  <td className="p-2 text-[#F0EFE8]">{r.credits}</td>
                  <td className="p-2 text-[#A09E97]">{r.orderId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
