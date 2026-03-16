'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from './AdminLayout';

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/brands': 'Brands',
  '/admin/generations': 'Generations',
  '/admin/credits': 'Credits',
  '/admin/contact': 'Contact submissions',
  '/admin/plans': 'Plans & Pricing',
  '/admin/api-settings': 'API Settings',
  '/admin/queues': 'Queue monitor',
  '/admin/appearance': 'Appearance',
  '/admin/profile': 'Profile',
};

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/admin/brands/')) return 'Brand detail';
  if (pathname.startsWith('/admin/plans/')) return 'Edit plan';
  return 'Admin';
}

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  return <AdminLayout pageTitle={getTitle(pathname)}>{children}</AdminLayout>;
}
