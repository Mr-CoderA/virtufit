'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { CONTACT } from '@/config/contact';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

type PublicContact = { email: string; phone: string; whatsapp: string; founderName: string };

const PLATFORMS = [
  { value: '', label: 'Select platform' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'wordpress', label: 'WordPress / WooCommerce' },
  { value: 'custom', label: 'Custom website' },
  { value: 'whatsapp', label: 'WhatsApp commerce' },
  { value: 'none', label: 'No website yet' },
  { value: 'other', label: 'Other' },
];

const SUBJECTS = [
  { value: '', label: 'Select topic' },
  { value: 'integration', label: 'Integration help' },
  { value: 'api', label: 'API question' },
  { value: 'enterprise', label: 'Enterprise pricing' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'general', label: 'General inquiry' },
];

const defaultContact: PublicContact = {
  email: CONTACT.email,
  phone: CONTACT.phoneDisplay,
  whatsapp: CONTACT.phone.replace(/\D/g, ''),
  founderName: CONTACT.founderName,
};

export default function ContactPage() {
  const [contact, setContact] = useState<PublicContact>(defaultContact);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [brand, setBrand] = useState('');
  const [platform, setPlatform] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/settings/contact')
      .then((r) => r.json())
      .then((d) => {
        if (d?.email) setContact({ email: d.email, phone: d.phone ?? defaultContact.phone, whatsapp: d.whatsapp ?? defaultContact.whatsapp, founderName: d.founderName ?? defaultContact.founderName });
      })
      .catch(() => {});
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Your name is required';
    else if (name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email.trim()) e.email = 'Your email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (!subject) e.subject = 'Please select a topic';
    if (!message.trim()) e.message = 'Message is required';
    else if (message.trim().length < 20) e.message = 'Message must be at least 20 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          brand: brand.trim() || undefined,
          platform: platform || undefined,
          subject: SUBJECTS.find((s) => s.value === subject)?.label || subject,
          message: message.trim(),
          website: website || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessName(name.trim());
        setSuccessEmail(email.trim());
        setSuccess(true);
      } else {
        setSubmitError(data.error || 'Something went wrong. Email us directly at ' + contact.email);
      }
    } catch {
      setSubmitError('Something went wrong. Email us directly at ' + contact.email);
    } finally {
      setLoading(false);
    }
  }

  const responseTimes = [
    { label: 'General inquiries', time: 'Within 24 hours' },
    { label: 'Integration support', time: 'Within 12 hours' },
    { label: 'Enterprise sales', time: 'Within 4 hours' },
  ];

  const faqs = [
    {
      q: 'How quickly can I integrate?',
      a: "Shopify integration takes under 10 minutes. WordPress plugin installs in 5. We'll walk you through it.",
    },
    {
      q: 'Do you offer a free trial?',
      a: 'Every account starts with 5 free credits — no credit card needed. Try a full generation before paying anything.',
    },
    {
      q: "What if the try-on quality isn't good enough?",
      a: "We only charge credits for successful generations. If the output fails, you pay nothing.",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#1A1915] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-[1100px]">
        {/* Hero */}
        <section className="mb-12 md:mb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-3">CONTACT</p>
          <h1 className="text-[42px] font-normal tracking-[-0.025em] text-[#F0EFE8] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Get in touch
          </h1>
          <p className="text-[15px] text-[#A09E97] max-w-[520px] leading-relaxed">
            Whether you&apos;re a fashion brand looking to integrate virtual try-on, or have a question about the API — we respond within 24 hours.
          </p>
        </section>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left — contact info cards */}
          <div className="space-y-6">
            <GlassCard className="p-6" cardNumber="01">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#65635D] mb-2">REACH OUT DIRECTLY</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#65635D] mb-1">Email</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`mailto:${contact.email}`} className="text-[#D9714A] hover:underline">
                      {contact.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(contact.email);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[12px] text-[#A09E97] hover:text-[#F0EFE8] border border-[rgba(240,239,232,0.14)] rounded-lg px-2 py-1"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#65635D] mb-1">Phone / WhatsApp</p>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${contact.phone}`} className="text-[#F0EFE8] hover:text-[#D9714A]">
                      {contact.phone}
                    </a>
                    <a
                      href={`https://wa.me/${contact.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#222219] border border-[rgba(240,239,232,0.08)] text-[#25D366] hover:bg-[#2C2C27]"
                      aria-label="WhatsApp"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#65635D] mb-1">Founder</p>
                  <p className="text-[#F0EFE8]">{contact.founderName}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6" cardNumber="02">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#65635D] mb-4">RESPONSE TIME</p>
              <div className="space-y-3">
                {responseTimes.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-[#A09E97]">{r.label}</span>
                    <span className="rounded-full border border-[rgba(240,239,232,0.08)] bg-[#2C2C27] px-3 py-1 text-[12px] text-[#F0EFE8]">
                      {r.time}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6" cardNumber="03">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#65635D] mb-2">ENTERPRISE</p>
              <p className="text-[15px] text-[#A09E97] mb-4">
                Need volume pricing, a custom SLA, or Pro resolution (2048px) for your brand?
              </p>
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent('Enterprise Inquiry — VirtuFit')}&body=${encodeURIComponent(
                  'Hi,\n\nI\'m interested in VirtuFit enterprise for [brand name].\n\nOur store:\nMonthly orders approx:\nPlatform (Shopify/WooCommerce/other):'
                )}`}
                className="block w-full text-center rounded-full border border-[rgba(240,239,232,0.14)] bg-transparent px-4 py-3 text-[13px] text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] transition-colors"
              >
                Start enterprise conversation →
              </a>
            </GlassCard>
          </div>

          {/* Right — form */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="text-[18px] font-medium text-[#F0EFE8] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Send a message
            </h2>
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(217,113,74,0.2)] text-[#D9714A] mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <p className="text-[18px] font-medium text-[#F0EFE8] mb-2">Message sent!</p>
                <p className="text-[15px] text-[#A09E97] mb-6">
                  Thanks {successName}. We&apos;ll get back to you at {successEmail} within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setName('');
                    setEmail('');
                    setBrand('');
                    setPlatform('');
                    setSubject('');
                    setMessage('');
                  }}
                  className="text-[14px] text-[#D9714A] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-[13px] text-[#A09E97] mb-1.5">Your name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ahmed Khan"
                    className={`input-glass w-full ${errors.name ? 'border-[#e24b4a]' : ''}`}
                  />
                  {errors.name && <p className="mt-1 text-[12px] text-[#e24b4a]">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-[13px] text-[#A09E97] mb-1.5">Your email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`input-glass w-full ${errors.email ? 'border-[#e24b4a]' : ''}`}
                  />
                  {errors.email && <p className="mt-1 text-[12px] text-[#e24b4a]">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="contact-brand" className="block text-[13px] text-[#A09E97] mb-1.5">Brand or company</label>
                  <input
                    id="contact-brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Brumano"
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label htmlFor="contact-platform" className="block text-[13px] text-[#A09E97] mb-1.5">Your platform</label>
                  <select
                    id="contact-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="input-glass w-full bg-[#1A1915]"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value} disabled={!p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-[13px] text-[#A09E97] mb-1.5">What&apos;s this about?</label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`input-glass w-full bg-[#1A1915] ${errors.subject ? 'border-[#e24b4a]' : ''}`}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value} disabled={!s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {errors.subject && <p className="mt-1 text-[12px] text-[#e24b4a]">{errors.subject}</p>}
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-[13px] text-[#A09E97] mb-1.5">Message</label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your store and what you're looking to achieve..."
                    rows={5}
                    className={`input-glass w-full resize-none ${errors.message ? 'border-[#e24b4a]' : ''}`}
                  />
                  {errors.message && <p className="mt-1 text-[12px] text-[#e24b4a]">{errors.message}</p>}
                </div>
                {/* Honeypot — hidden via class, not type="hidden" */}
                <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                {submitError && <p className="text-[13px] text-[#e24b4a]">{submitError}</p>}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full rounded-full py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send message →'
                  )}
                </Button>
              </form>
            )}
          </GlassCard>
        </div>

        {/* FAQ strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6 hover:bg-[#2C2C27] transition-colors"
              style={{ borderWidth: '0.5px' }}
            >
              <p className="text-[14px] font-normal text-[#F0EFE8] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {faq.q}
              </p>
              <p className="text-[13px] text-[#A09E97] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
