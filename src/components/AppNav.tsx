'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { VirtuFitLogo } from './VirtuFitLogo';
export function AppNav({ session }: { session: { userId: string } | null; initialCredits?: number }) {
  const [open, setOpen] = useState(false); const path = usePathname(); const router = useRouter();
  async function signOut() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) { localStorage.removeItem('brandToken'); setOpen(false); router.push('/'); router.refresh(); }
  }
  const links = [['/', 'Fitting room'], ['/docs', 'Studio guide'], ['/contact', 'Get in touch']];
  return <header className="site-header"><div className="site-header-inner"><VirtuFitLogo size="nav"/><nav className={`site-navigation ${open ? 'is-open' : ''}`} aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</Link>)}<a href="https://github.com/Mr-CoderA/virtufit" target="_blank" rel="noreferrer">Source ↗</a>{session && <button className="nav-sign-out" onClick={() => void signOut()}>Sign out</button>}</nav><div className="site-header-actions"><span className="free-label">FREE & OPEN SOURCE</span><Link className="site-account-link" href={session ? '/dashboard' : '/login'}>{session ? 'Your account' : 'Sign in'}</Link><button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button></div></div></header>;
}
