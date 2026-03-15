'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VirtuFitLogo } from '@/components/VirtuFitLogo';
import { CONTACT } from '@/config/contact';

type PublicContact = { email: string; phone: string; whatsapp: string };

const defaultFooterContact: PublicContact = {
  email: CONTACT.email,
  phone: CONTACT.phoneDisplay,
  whatsapp: CONTACT.phone.replace(/\D/g, ''),
};

export function SiteFooter() {
  const [contact, setContact] = useState<PublicContact>(defaultFooterContact);

  useEffect(() => {
    fetch('/api/settings/contact')
      .then((r) => r.json())
      .then((d) => {
        if (d?.email) setContact({ email: d.email, phone: d.phone ?? defaultFooterContact.phone, whatsapp: d.whatsapp ?? defaultFooterContact.whatsapp });
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-[rgba(240,239,232,0.08)] bg-[#1A1915]" style={{ borderTopWidth: '0.5px' }}>
      <div className="mx-auto max-w-[1100px] px-5 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <VirtuFitLogo showTagline={false} size="nav" />
            <p className="mt-3 text-[13px] text-[#A09E97]">Virtual try-on API for fashion brands.</p>
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-[#F0EFE8] mb-3">Contact</h3>
            <a href={`mailto:${contact.email}`} className="block text-[13px] text-[#A09E97] hover:text-[#D9714A] transition-colors">
              {contact.email}
            </a>
            <a href={`tel:${contact.phone}`} className="block text-[13px] text-[#A09E97] hover:text-[#D9714A] transition-colors mt-1">
              {contact.phone}
            </a>
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[13px] text-[#D9714A] hover:underline">
              Chat on WhatsApp →
            </a>
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-[#F0EFE8] mb-3">Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-[13px] text-[#A09E97] hover:text-[#F0EFE8] no-underline">Home</Link>
              <Link href="/docs" className="text-[13px] text-[#A09E97] hover:text-[#F0EFE8] no-underline">Documentation</Link>
              <Link href="/contact" className="text-[13px] text-[#A09E97] hover:text-[#F0EFE8] no-underline">Contact</Link>
              <Link href="/login" className="text-[13px] text-[#A09E97] hover:text-[#F0EFE8] no-underline">Sign in</Link>
              <Link href="/signup" className="text-[13px] text-[#A09E97] hover:text-[#F0EFE8] no-underline">Sign up</Link>
            </nav>
          </div>
        </div>
        <p className="mt-10 pt-8 border-t border-[rgba(240,239,232,0.08)] text-[12px] text-[#65635D] text-center">
          VirtuFit · Virtual Try-On API
        </p>
      </div>
    </footer>
  );
}
