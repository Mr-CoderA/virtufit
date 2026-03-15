'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  { section: 'ACCOUNT', items: [{ href: '/admin/profile', label: 'Admin profile', icon: User }, { href: '/admin/logout', label: 'Sign out', icon: LogOut }] },
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
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactUnread, setContactUnread] = useState(0);

  useEffect(() => {
    adminApi.contactCount().then((r) => {
      if (r.data?.unreadCount != null) setContactUnread(r.data.unreadCount);
    });
  }, []);

  useEffect(() => {
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
  }, []);

  if (!getAdminToken()) return null;

  const initials = admin?.name ? admin.name.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-[#1A1915] flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#222219] border-r border-[rgba(240,239,232,0.08)] flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRightWidth: '0.5px' }}
      >
        <div className="p-4 flex items-center justify-between border-b border-[rgba(240,239,232,0.08)] md:justify-center">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <svg width="32" height="32" viewBox="0 0 100 100" className="shrink-0">
              <rect width="100" height="100" rx="24" fill="#1A1915" />
              <circle cx="50" cy="26" r="10" fill="none" stroke="#F0EFE8" strokeWidth="2" />
              <path d="M30,42 L20,47 L22,62 L34,58 L32,78 L68,78 L66,58 L78,62 L80,47 L70,42 L50,54 Z" fill="none" stroke="#F0EFE8" strokeWidth="2" strokeLinejoin="round" />
              <path d="M38,42 L50,54 L62,42" fill="none" stroke="#F0EFE8" strokeWidth="2" strokeLinejoin="round" />
              <path d="M78,18 L80,23 L85,25 L80,27 L78,32 L76,27 L71,25 L76,23 Z" fill="#D9714A" />
            </svg>
            <span className="text-[14px] font-medium text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>VirtuFit</span>
          </Link>
          <button type="button" className="md:hidden p-2 text-[#A09E97] hover:text-[#F0EFE8]" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="py-2 px-2 text-[10px] font-medium uppercase tracking-wider text-[#D9714A]">Admin</div>
        <nav className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_LINKS_FIXED.map((group) => (
            <div key={group.section} className="mb-4">
              <div className="px-4 py-1 text-[11px] font-medium uppercase tracking-wider text-[#65635D]">{group.section}</div>
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;
                if (item.href === '/admin/logout') {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#A09E97] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.04)]"
                      onClick={() => {
                        clearAdminToken();
                        window.location.href = '/admin/login';
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                }
                const badge = 'badgeKey' in item && item.badgeKey === 'contactUnread' && contactUnread > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                      isActive ? 'text-[#D9714A] bg-[rgba(217,113,74,0.08)] border-l-2 border-[#D9714A]' : 'text-[#A09E97] hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.04)]'
                    }`}
                    style={isActive ? { marginLeft: -1, paddingLeft: 15 } : {}}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {badge && (
                      <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-[#D9714A] text-[10px] font-medium text-[#1A1915] flex items-center justify-center px-1">
                        {contactUnread > 99 ? '99+' : contactUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
        <header className="sticky top-0 z-30 h-14 border-b border-[rgba(240,239,232,0.08)] bg-[#1A1915] flex items-center justify-between px-4 md:px-6" style={{ borderBottomWidth: '0.5px' }}>
          <div className="flex items-center gap-4">
            <button type="button" className="md:hidden p-2 text-[#A09E97] hover:text-[#F0EFE8]" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[18px] font-normal text-[#F0EFE8]" style={{ fontFamily: 'Georgia, serif' }}>{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-[12px] px-3 py-1 rounded-full ${systemStatus === 'operational' ? 'bg-[#0d5c0d] text-[#a3e0a3]' : 'bg-[#b32d2e] text-[#f0a0a0]'}`}>
              {systemStatus === 'operational' ? 'All systems operational' : 'Issues detected'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#222219] border border-[rgba(240,239,232,0.12)] flex items-center justify-center text-[12px] font-medium text-[#F0EFE8]">
                {initials}
              </div>
              <span className="hidden sm:inline text-[13px] text-[#A09E97]">{admin?.name ?? 'Admin'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
    </div>
  );
}
