'use client';

import React, { useState, useEffect } from 'react';
import { Mail, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { adminApi } from '@/api/adminApi';

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
    <div className="space-y-6">
      <h2 className="text-[20px] font-normal text-[#F0EFE8] mb-1" style={{ fontFamily: 'Georgia, serif' }}>Contact submissions</h2>
      <p className="text-[13px] text-[#A09E97] mb-5">View and manage contact form submissions.</p>
      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(240,239,232,0.08)' }}>
        {loading ? (
          <p className="p-6 text-[#A09E97] text-[14px]">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-[#65635D] text-[14px] py-12 text-center">No contact submissions yet.</p>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-[#222219] rounded-xl" style={{ WebkitOverflowScrolling: 'touch', border: '0.5px solid rgba(240,239,232,0.08)' }}>
              <table className="w-full min-w-[600px] border-collapse bg-[#222219]">
                <thead>
                  <tr className="border-b border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderBottomWidth: '0.5px' }}>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">#</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Email</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Message</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#65635D] text-left whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <React.Fragment key={s.id}>
                      <tr
                        className={`border-b border-[rgba(240,239,232,0.06)] transition-colors hover:bg-[#2C2C27] ${!s.read ? 'border-l-4 border-l-[#D9714A]' : ''}`}
                        style={{ borderBottomWidth: '0.5px' }}
                      >
                        <td className="py-3.5 px-4 text-[13px] text-[#65635D] w-10 whitespace-nowrap">{i + 1}</td>
                        <td className="py-3.5 px-4 text-[13px] text-[#F0EFE8] font-medium whitespace-nowrap">{s.name}</td>
                        <td className="py-3.5 px-4 text-[13px] whitespace-nowrap">
                          <a href={`mailto:${s.email}`} className="text-[#D9714A] hover:underline">
                            {s.email}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 text-[13px] text-[#A09E97] max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {s.message}
                          <button type="button" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="ml-1 text-[#D9714A] hover:underline text-[12px] whitespace-nowrap">
                            View full
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-[13px] text-[#A09E97] whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                              className="p-1.5 rounded-lg border border-[rgba(240,239,232,0.14)] text-[#A09E97] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors"
                              title={expandedId === s.id ? 'Collapse' : 'Expand'}
                            >
                              {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {!s.read && (
                              <button
                                type="button"
                                onClick={() => markRead(s.id)}
                                className="rounded-full border border-[rgba(240,239,232,0.14)] px-3 py-1 text-[12px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                            <a
                              href={replyUrl(s)}
                              className="rounded-full border border-[rgba(240,239,232,0.14)] px-3 py-1 text-[12px] text-[#D9714A] hover:bg-[rgba(217,113,74,0.1)] inline-flex items-center gap-1 transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Reply
                            </a>
                          </div>
                        </td>
                      </tr>
                      {expandedId === s.id ? (
                        <tr className="bg-[#1A1915] border-b border-[rgba(240,239,232,0.06)]" style={{ borderBottomWidth: '0.5px' }}>
                          <td colSpan={6} className="p-4">
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
            <p className="md:hidden text-center text-[11px] text-[#65635D] mt-2">← Scroll to see more →</p>
          </>
        )}
      </div>
      {total > 0 && (
        <p className="mt-3 text-[13px] text-[#65635D]">
          {total} submission{total !== 1 ? 's' : ''} · {unreadCount} unread
        </p>
      )}
    </div>
  );
}
