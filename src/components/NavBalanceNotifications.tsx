'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { brandFetch } from '@/lib/brand-api';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function NavBalanceNotifications({
  initialCredits,
}: {
  initialCredits: number;
}) {
  const [credits, setCredits] = useState(initialCredits);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const me = await brandFetch('/api/auth/me', { credentials: 'include' });
      if (!me.ok) {
        setLoading(false);
        return;
      }
      const u = await me.json();
      if (u.user?.credits != null) setCredits(u.user.credits);

      const res = await brandFetch('/api/notifications', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onFocus() {
      load();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function markRead(id: string) {
    await brandFetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      credentials: 'include',
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await brandFetch('/api/notifications/mark-all-read', {
      method: 'POST',
      credentials: 'include',
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 rounded-full border border-[rgba(21,43,67,0.14)] bg-[rgba(21,43,67,0.14)] px-2 py-1 text-[11px] text-[var(--vf-muted)] transition-[background,border-color] duration-200 ease-out hover:bg-[rgba(21,43,67,0.14)] hover:border-[rgba(21,43,67,0.14)] md:gap-2 md:px-3.5 md:py-1.5 md:text-[13px]"
        style={{ borderWidth: '0.5px' }}
        title="Balance — open dashboard to top up"
      >
        <span aria-hidden>⚡</span>
        <span className="hidden min-[361px]:inline">{loading ? '…' : credits}</span>
        <span className="hidden sm:inline">credits</span>
      </Link>

      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            if (!open) load();
          }}
          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] text-[var(--vf-muted)] transition-colors duration-200 hover:bg-[var(--vf-surface-hover)] hover:text-[var(--vf-ink)] md:h-10 md:w-10"
          aria-label="Notifications"
          aria-expanded={open}
        >
          <Bell className="h-3.5 w-3.5 md:h-5 md:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--vf-accent)] px-1 text-[10px] font-medium text-[var(--vf-page)]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full z-[80] mt-2 flex w-[min(calc(100vw-2rem),22rem)] max-h-[min(70vh,400px)] flex-col overflow-hidden rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-[4.5rem] max-sm:mt-0 max-sm:w-[calc(100vw-2rem)]"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-[rgba(21,43,67,0.14)] px-4 py-3">
              <span className="text-[13px] font-medium text-[var(--vf-ink)]">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] uppercase tracking-wider text-[var(--vf-accent)] hover:opacity-80 transition-opacity"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 && !loading ? (
                <p className="px-4 py-8 text-center text-[15px] text-[var(--vf-quiet)]">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-[rgba(21,43,67,0.14)]">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.read && markRead(n.id)}
                        className={`w-full text-left px-4 py-3 transition-colors duration-200 hover:bg-[var(--vf-surface-hover)] ${
                          !n.read ? 'bg-[var(--vf-page)]/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--vf-accent)]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-[var(--vf-ink)]">{n.title}</p>
                            {n.body && (
                              <p className="mt-1 text-[13px] leading-relaxed text-[var(--vf-muted)]">{n.body}</p>
                            )}
                            <p className="mt-1.5 text-[11px] text-[var(--vf-quiet)]">
                              {new Date(n.createdAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-[rgba(21,43,67,0.14)] px-4 py-2">
              <Link
                href="/dashboard"
                className="block py-2 text-center text-[12px] text-[var(--vf-accent)] hover:opacity-80"
                onClick={() => setOpen(false)}
              >
                Open dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
