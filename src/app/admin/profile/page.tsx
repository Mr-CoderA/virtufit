'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/api/adminApi';

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<{ name: string; email: string; role: string; lastLoginAt: string | null } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.me().then((r) => {
      if (r.data?.admin) setAdmin(r.data.admin);
    });
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirm do not match');
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Password changed. Sign in again.');
      adminApi.logout();
      window.location.href = '/admin/login';
    } else {
      setMessage(data.error || 'Failed');
    }
  };

  if (!admin) return <p className="text-[#A09E97]">Loading…</p>;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Admin profile</h3>
        <p className="text-[13px] text-[#A09E97]">Name: {admin.name}</p>
        <p className="text-[13px] text-[#A09E97]">Email: {admin.email}</p>
        <p className="text-[13px] text-[#A09E97]">Role: {admin.role}</p>
        <p className="text-[13px] text-[#A09E97]">Last login: {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : '—'}</p>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-4">Change password</h3>
        <p className="text-[12px] text-[#65635D] mb-2">Min 12 characters, include a number and a symbol.</p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-[12px] text-[#A09E97] mb-1">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" />
          </div>
          <div>
            <label className="block text-[12px] text-[#A09E97] mb-1">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={12} className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" />
          </div>
          <div>
            <label className="block text-[12px] text-[#A09E97] mb-1">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full rounded-lg border border-[rgba(240,239,232,0.12)] bg-[#1A1915] px-3 py-2 text-[14px] text-[#F0EFE8]" />
          </div>
          {message && <p className={`text-[13px] ${message.includes('Sign in') ? 'text-[#2d8a2d]' : 'text-[#e0a0a0]'}`}>{message}</p>}
          <button type="submit" disabled={loading} className="rounded-lg bg-[#D9714A] text-[#1A1915] px-4 py-2 text-[13px] font-medium disabled:opacity-50">Save</button>
        </form>
      </div>

      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <h3 className="text-[14px] font-medium text-[#F0EFE8] mb-2">Active sessions</h3>
        <p className="text-[13px] text-[#65635D]">Session management coming soon.</p>
      </div>
    </div>
  );
}
