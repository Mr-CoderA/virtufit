'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Sparkles,
  Coins,
  DollarSign,
  Percent,
  Code,
  Palette,
  User,
  LogOut,
  Menu,
  X,
  LayoutList,
  Mail,
} from 'lucide-react';
import { getAdminToken, adminApi, clearAdminToken, redirectToAdminLogin } from '@/api/adminApi';

const SIDEBAR_LINKS_FIXED = [
  { section: 'OVERVIEW', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }, { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 }] },
  { section: 'MANAGEMENT', items: [{ href: '/admin/brands', label: 'Brands', icon: Users }, { href: '/admin/generations', label: 'Generations', icon: Sparkles }, { href: '/admin/credits', label: 'Credits', icon: Coins }, { href: '/admin/contact', label: 'Contact', icon: Mail, badgeKey: 'contactUnread' }] },
  { section: 'SYSTEM', items: [{ href: '/admin/plans', label: 'Plans & Pricing', icon: DollarSign }, { href: '/admin/credits', label: 'Credit Rate', icon: Percent }, { href: '/admin/api-settings', label: 'API Settings', icon: Code }, { href: '/admin/queues', label: 'Queue monitor', icon: LayoutList }, { href: '/admin/appearance', label: 'Appearance', icon: Palette }] },
  { section: 'ACCOUNT', items: [{ href: '/admin/profile', label: 'Admin profile', icon: User }] },
];

export function AdminLayout({
  children,
  pageTitle = 'Admin',
  systemStatus = 'operational',
}: {
  children: React.ReactNode;
  pageTitle?: string;
  systemStatus?: 'operational' | 'issues';
}) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactUnread, setContactUnread] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    adminApi.contactCount().then((r) => {
      if (r.data?.unreadCount != null) setContactUnread(r.data.unreadCount);
    });
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const t = getAdminToken();
    if (!t) {
      redirectToAdminLogin();
      return;
    }
    adminApi.me().then((r) => {
      if (r.status === 401 || r.error) {
        clearAdminToken();
        redirectToAdminLogin();
        return;
      }
      if (r.data?.admin) setAdmin({ name: r.data.admin.name, email: r.data.admin.email });
    });
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#1A1915] flex items-center justify-center">
        <span className="text-[#A09E97] text-[14px]">Loading…</span>
      </div>
    );
  }
  if (!getAdminToken()) {
    return null;
  }

  const initials = admin?.name ? admin.name.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'A';

  return (
    <div className="flex min-h-screen bg-[#1A1915]">
      {/* Sidebar: mobile fixed drawer 260px, desktop in-flow 220px sticky */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-shrink-0 flex-col bg-[#1A1915] pb-6 transition-transform duration-[250ms] ease-out md:relative md:sticky md:top-0 md:block md:h-screen md:w-[220px] md:translate-x-0 md:pb-6 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderRight: '0.5px solid rgba(240,239,232,0.08)' }}
      >
        {/* Logo area */}
        <div
          className="flex flex-shrink-0 items-center gap-2 border-b px-5 pb-4 pt-5"
          style={{ borderBottomWidth: '0.5px', borderColor: 'rgba(240,239,232,0.08)', paddingTop: 20, paddingBottom: 16, marginBottom: 8 }}
        >
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <span className="font-serif text-[17px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>
              Virtu<span className="text-[#D9714A]">Fit</span>
            </span>
          </Link>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#65635D]"
            style={{ background: 'rgba(240,239,232,0.06)' }}
          >
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto">
          {SIDEBAR_LINKS_FIXED.map((group, gIdx) => (
            <div key={group.section}>
              {gIdx > 0 && (
                <div
                  className="mx-4 my-1.5"
                  style={{ height: '0.5px', background: 'rgba(240,239,232,0.06)' }}
                />
              )}
              <div
                className={`px-4 pb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#65635D] ${gIdx === 0 ? 'pt-2' : 'pt-4'}`}
              >
                {group.section}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;
                const badge = 'badgeKey' in item && item.badgeKey === 'contactUnread' && contactUnread > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group mx-2 mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] no-underline transition-[background,color] duration-150 ${
                      isActive
                        ? 'bg-[rgba(217,113,74,0.12)] font-medium text-[#D9714A]'
                        : 'text-[#A09E97] hover:bg-[rgba(240,239,232,0.05)] hover:text-[#F0EFE8]'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#D9714A] opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                    />
                    {item.label}
                    {badge && (
                      <span className="ml-auto min-w-[18px] flex h-[18px] items-center justify-center rounded-full bg-[#D9714A] px-1 text-[10px] font-medium text-[#1A1915]">
                        {contactUnread > 99 ? '99+' : contactUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom admin info row */}
        <div
          className="mt-auto flex flex-shrink-0 items-center gap-2.5 border-t px-4 py-3"
          style={{ borderTopWidth: '0.5px', borderColor: 'rgba(240,239,232,0.08)', background: '#1A1915' }}
        >
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-[#D9714A]"
            style={{ background: 'rgba(217,113,74,0.15)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[#F0EFE8] whitespace-nowrap">
              {admin?.name ?? 'Admin'}
            </p>
            <p className="text-[11px] text-[#65635D]">Admin</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              window.location.href = '/admin/login';
            }}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[#65635D] transition-colors hover:bg-[rgba(217,113,74,0.1)] hover:text-[#D9714A]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between bg-[#1A1915] pl-6 pr-5"
          style={{ height: 56, borderBottom: '0.5px solid rgba(240,239,232,0.08)' }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#A09E97] transition-colors hover:bg-[rgba(240,239,232,0.06)] md:hidden"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1
              className="truncate text-[17px] font-normal text-[#F0EFE8] whitespace-nowrap max-[768px]:max-w-[calc(100vw-200px)]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {pageTitle}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-2">
            <span
              className={`hidden min-[481px]:inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                systemStatus === 'operational'
                  ? 'bg-[rgba(217,113,74,0.1)] text-[#D9714A]'
                  : 'bg-[rgba(226,75,74,0.12)] text-[#E24B4A]'
              }`}
              style={{ border: '0.5px solid rgba(217,113,74,0.25)' }}
            >
              {systemStatus === 'operational' ? 'All systems operational' : 'Issues detected'}
            </span>
            <div
              className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-[#D9714A]"
              style={{ background: 'rgba(217,113,74,0.15)' }}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="admin-content flex-1 overflow-x-hidden overflow-y-auto p-4 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>

      {/* Backdrop when sidebar open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[49] bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}
