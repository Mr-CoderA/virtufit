'use client';

import React, { useState, useEffect } from 'react';
import { Mail, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { adminApi } from '@/api/adminApi';
import { AdminLayout } from '../AdminLayout';

type Submission = {
  id: string;
  name: string;
  email: string;
  brand: string | null;
  platform: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.contactList(1).then((r) => {
      if (r.data) {
        setSubmissions(r.data.submissions);
        setTotal(r.data.total);
        setUnreadCount(r.data.unreadCount);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await adminApi.contactMarkRead(id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, read: true } : s)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  const replyUrl = (s: Submission) =>
    `mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent('Re: ' + s.subject)}`;

  return (
    <AdminLayout pageTitle="Contact submissions">
      <div className="rounded-xl border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
        {loading ? (
          <p className="p-6 text-[#A09E97]">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="p-6 text-[#A09E97]">No contact submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[600px]">
              <thead>
                <tr className="border-b border-[rgba(240,239,232,0.08)] text-left text-[#65635D]">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Brand</th>
                  <th className="p-3 font-medium">Subject</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr
                      className={`border-b border-[rgba(240,239,232,0.06)] hover:bg-[rgba(240,239,232,0.02)] ${
                        !s.read ? 'border-l-4 border-l-[#D9714A]' : ''
                      }`}
                    >
                      <td className="p-3 text-[#A09E97]">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-[#F0EFE8]">{s.name}</td>
                      <td className="p-3">
                        <a href={`mailto:${s.email}`} className="text-[#D9714A] hover:underline">
                          {s.email}
                        </a>
                      </td>
                      <td className="p-3 text-[#A09E97]">{s.brand ?? '—'}</td>
                      <td className="p-3 text-[#F0EFE8]">{s.subject}</td>
                      <td className="p-3">
                        <span className={s.read ? 'text-[#65635D]' : 'text-[#D9714A]'}>{s.read ? 'Read' : 'Unread'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            className="p-1.5 rounded border border-[rgba(240,239,232,0.14)] text-[#A09E97] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.04)]"
                            title={expandedId === s.id ? 'Collapse' : 'Expand'}
                          >
                            {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {!s.read && (
                            <button
                              type="button"
                              onClick={() => markRead(s.id)}
                              className="p-1.5 rounded border border-[rgba(240,239,232,0.14)] text-[#A09E97] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.04)] text-[11px]"
                            >
                              Mark read
                            </button>
                          )}
                          <a
                            href={replyUrl(s)}
                            className="p-1.5 rounded border border-[rgba(240,239,232,0.14)] text-[#D9714A] hover:bg-[rgba(217,113,74,0.08)] text-[11px] inline-flex items-center gap-1"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Reply
                          </a>
                        </div>
                      </td>
                    </tr>
                    {expandedId === s.id ? (
                      <tr className="bg-[#1A1915] border-b border-[rgba(240,239,232,0.06)]">
                        <td colSpan={7} className="p-4">
                          <div className="flex items-start gap-2 text-[#A09E97]">
                            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#F0EFE8]">
                              {s.message}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {total > 0 && (
        <p className="mt-3 text-[13px] text-[#65635D]">
          {total} submission{total !== 1 ? 's' : ''} · {unreadCount} unread
        </p>
      )}
    </AdminLayout>
  );
}
